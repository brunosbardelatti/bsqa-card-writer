from fastapi import APIRouter, File, UploadFile, Form, HTTPException, Depends
from fastapi.responses import JSONResponse
from backend.services.ia_factory import get_ia_service
from backend.utils.file_utils import extract_text_from_file
from backend.utils.prompt_loader import load_prompt_template, get_available_analysis_types, get_analysis_placeholders
from backend.utils.dependencies import get_current_user
from backend.models.user import User

router = APIRouter(tags=["Análise com IA"])

@router.get("/analysis-types")
async def get_analysis_types(current_user: User = Depends(get_current_user)):
    """
    ## 📋 Obter Tipos de Análise Disponíveis
    
    Retorna a lista de tipos de análise disponíveis e seus placeholders.
    
    **Requer autenticação**
    
    ### Retorna:
    - **analysis_types**: Lista de tipos de análise disponíveis
    - **placeholders**: Placeholders específicos para cada tipo
    
    ### Erros:
    - **401**: Token inválido ou expirado
    - **403**: Usuário inativo
    """
    return JSONResponse(content={
        "analysis_types": get_available_analysis_types(),
        "placeholders": get_analysis_placeholders()
    })

@router.post("/analyze")
async def analyze(
    requirements: str = Form(None),
    file: UploadFile = File(None),
    service: str = Form("openai"),
    analyse_type: str = Form(...),
    streaming: bool = Form(False),
    stackspot_knowledge: bool = Form(False),
    return_ks_in_response: bool = Form(False),
    current_user: User = Depends(get_current_user)
):
    """
    ## 🤖 Analisar Requisitos com IA
    
    Realiza análise de requisitos usando IA (OpenAI ou StackSpot).
    
    **Requer autenticação**
    
    ### Parâmetros (Form Data):
    - **requirements**: Requisitos em texto (opcional se enviar file)
    - **file**: Arquivo PDF, TXT ou JSON (opcional se enviar requirements)
    - **service**: Serviço de IA ("openai" ou "stackspot") - padrão: "openai"
    - **analyse_type**: Tipo de análise (obrigatório)
    - **streaming**: Resposta em streaming (apenas StackSpot)
    - **stackspot_knowledge**: Usar conhecimento StackSpot
    - **return_ks_in_response**: Retornar KS na resposta
    
    ### Retorna:
    - **result**: Resultado da análise pela IA
    
    ### Erros:
    - **400**: Parâmetros inválidos ou arquivo não suportado
    - **401**: Token inválido ou expirado
    - **403**: Usuário inativo
    - **500**: Erro ao gerar resposta da IA
    
    ### Tipos de Análise Disponíveis:
    - card_QA_writer
    - test_case_flow_classifier
    - swagger_postman
    - swagger_python
    - robot_api_generator
    - swagger_robot_generator
    - code_review_diff
    """
    if file and requirements:
        raise HTTPException(status_code=400, detail="Use only one input method: file or text.")
    if file:
        allowed_types = ["application/pdf", "text/plain", "text/utf-8", "text/txt", "application/txt", "application/json"]
        if file.content_type not in allowed_types:
            raise HTTPException(status_code=400, detail="Tipos de arquivo aceitos: PDF (.pdf), TXT (.txt) e JSON (.json). Outros formatos não são suportados.")
        file.file.seek(0, 2)
        file_size = file.file.tell()
        file.file.seek(0)
        if file_size > 100 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="Arquivo maior que o tamanho de 100MB suportado. Tente com outro arquivo.")
        try:
            content = extract_text_from_file(file)
            if not content.strip():
                raise ValueError("Arquivo enviado está vazio.")
        except UnicodeDecodeError as e:
            raise HTTPException(status_code=400, detail=f"Erro de encoding no arquivo. O arquivo pode estar corrompido ou usar um encoding não suportado. Detalhes: {str(e)}")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Erro ao processar arquivo: {str(e)}")
    elif requirements and requirements.strip():
        content = requirements
    else:
        raise HTTPException(status_code=400, detail="Provide requirements via file or text.")

    prompt_template = load_prompt_template(analyse_type)
    prompt = prompt_template.format(requirements=content)

    try:
        ia_service = get_ia_service(service)
        result = ia_service.generate_response(prompt, streaming=streaming, stackspot_knowledge=stackspot_knowledge, return_ks_in_response=return_ks_in_response)
        return JSONResponse(content={"result": result})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating response: {e}") 