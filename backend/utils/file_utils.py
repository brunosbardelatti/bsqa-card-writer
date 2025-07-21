import PyPDF2
import io
import json


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
    return uploaded_file.file.read().decode("utf-8") 