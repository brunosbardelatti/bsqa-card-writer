from fastapi import APIRouter, File, UploadFile, Form, HTTPException
from fastapi.responses import JSONResponse
from backend.services.ia_factory import get_ia_service
from backend.utils.file_utils import extract_text_from_file
from backend.utils.prompt_loader import load_prompt_template, get_available_analysis_types

router = APIRouter()

@router.get("/analysis-types")
async def get_analysis_types():
    """Retorna os tipos de análise disponíveis"""
    return JSONResponse(content={"analysis_types": get_available_analysis_types()})

@router.post("/analyze")
async def analyze(
    requirements: str = Form(None),
    file: UploadFile = File(None),
    service: str = Form("openai"),
    analyse_type: str = Form(...),
    streaming: bool = Form(False),
    stackspot_knowledge: bool = Form(False),
    return_ks_in_response: bool = Form(False)
):
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
                raise ValueError("Uploaded file is empty.")
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))
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