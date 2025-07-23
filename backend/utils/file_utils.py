import PyPDF2
import io
import json

# Import opcional da biblioteca chardet
try:
    import chardet
    CHARDET_AVAILABLE = True
except ImportError:
    CHARDET_AVAILABLE = False
    print("Aviso: Biblioteca 'chardet' não encontrada. A detecção automática de encoding será desabilitada.")


def extract_text_from_pdf(pdf_file: io.BytesIO) -> str:
    reader = PyPDF2.PdfReader(pdf_file)
    text = ""
    for page in reader.pages:
        text += page.extract_text() + "\n"
    return text


def extract_text_from_json(json_bytes) -> str:
    try:
        # Garante que json_bytes é um objeto de bytes
        if hasattr(json_bytes, 'read'):
            json_bytes.seek(0)
            data = json.loads(json_bytes.read().decode("utf-8"))
        else:
            data = json.loads(json_bytes.decode("utf-8"))
    except Exception:
        return "Erro ao ler arquivo JSON."
    # Suporte básico para Swagger/OpenAPI
    if "paths" in data:
        text = []
        for path, methods in data["paths"].items():
            for method, details in methods.items():
                desc = details.get("description") or details.get("summary") or ""
                text.append(f"{method.upper()} {path} - {desc}")
        return "\n".join(text)
    return json.dumps(data, indent=2, ensure_ascii=False)


def extract_text_from_file(uploaded_file) -> str:
    if uploaded_file.content_type == "application/pdf":
        return extract_text_from_pdf(io.BytesIO(uploaded_file.file.read()))
    if uploaded_file.content_type == "application/json":
        uploaded_file.file.seek(0)
        return extract_text_from_json(uploaded_file.file)
    
    # Para arquivos de texto (TXT), tentar diferentes encodings
    uploaded_file.file.seek(0)
    content = uploaded_file.file.read()
    
    print(f"Processando arquivo: {uploaded_file.filename}, tipo: {uploaded_file.content_type}, tamanho: {len(content)} bytes")
    
    # Tentar detectar o encoding automaticamente (se chardet estiver disponível)
    if CHARDET_AVAILABLE:
        try:
            detected = chardet.detect(content)
            if detected['confidence'] > 0.7:
                try:
                    return content.decode(detected['encoding'])
                except UnicodeDecodeError:
                    pass
        except Exception:
            pass
    
    # Lista de encodings para tentar
    encodings = ['utf-8', 'latin-1', 'cp1252', 'iso-8859-1']
    
    for encoding in encodings:
        try:
            return content.decode(encoding)
        except UnicodeDecodeError:
            continue
    
    # Se nenhum encoding funcionar, tentar com tratamento de erros
    try:
        return content.decode('utf-8', errors='replace')
    except Exception:
        return content.decode('latin-1', errors='replace') 