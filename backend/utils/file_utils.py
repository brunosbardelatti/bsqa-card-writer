import PyPDF2
import io


def extract_text_from_pdf(pdf_file: io.BytesIO) -> str:
    reader = PyPDF2.PdfReader(pdf_file)
    text = ""
    for page in reader.pages:
        text += page.extract_text() + "\n"
    return text


def extract_text_from_file(uploaded_file) -> str:
    if uploaded_file.content_type == "application/pdf":
        return extract_text_from_pdf(io.BytesIO(uploaded_file.file.read()))
    return uploaded_file.file.read().decode("utf-8") 