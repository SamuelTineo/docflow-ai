import io
import os
import tempfile
import zipfile

import fitz
from PIL import Image

SUPPORTED: dict[str, list[str]] = {
    "pdf":  ["docx", "png", "jpg"],
    "docx": ["pdf"],
    "png":  ["pdf"],
    "jpg":  ["pdf"],
    "jpeg": ["pdf"],
}

MIME = {
    "pdf":  "application/pdf",
    "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "png":  "image/png",
    "jpg":  "image/jpeg",
    "zip":  "application/zip",
}


def get_supported_targets(ext: str) -> list[str]:
    return SUPPORTED.get(ext.lower().lstrip("."), [])


def run_conversion(file_bytes: bytes, source_ext: str, target_format: str) -> tuple[bytes, str, str]:
    """Returns (result_bytes, mime_type, file_suffix)."""
    src = source_ext.lower().lstrip(".")
    tgt = target_format.lower()

    if tgt not in SUPPORTED.get(src, []):
        raise ValueError(f"Conversión no soportada: {src} → {tgt}")

    if src == "pdf" and tgt in ("png", "jpg"):
        return _pdf_to_images(file_bytes, tgt)

    if src in ("png", "jpg", "jpeg") and tgt == "pdf":
        return _image_to_pdf(file_bytes)

    if src == "pdf" and tgt == "docx":
        return _pdf_to_docx(file_bytes)

    if src == "docx" and tgt == "pdf":
        return _docx_to_pdf(file_bytes)

    raise ValueError(f"Conversión no implementada: {src} → {tgt}")


def _pdf_to_images(file_bytes: bytes, fmt: str) -> tuple[bytes, str, str]:
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    mat = fitz.Matrix(2, 2)  # 144 DPI

    if len(doc) == 1:
        pix = doc[0].get_pixmap(matrix=mat)
        return pix.tobytes(fmt), MIME[fmt], f".{fmt}"

    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        for i, page in enumerate(doc):
            pix = page.get_pixmap(matrix=mat)
            zf.writestr(f"page_{i + 1:03d}.{fmt}", pix.tobytes(fmt))
    return buf.getvalue(), MIME["zip"], ".zip"


def _image_to_pdf(file_bytes: bytes) -> tuple[bytes, str, str]:
    img = Image.open(io.BytesIO(file_bytes)).convert("RGB")
    buf = io.BytesIO()
    img.save(buf, format="PDF")
    return buf.getvalue(), MIME["pdf"], ".pdf"


def _pdf_to_docx(file_bytes: bytes) -> tuple[bytes, str, str]:
    from pdf2docx import Converter

    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp_pdf:
        tmp_pdf.write(file_bytes)
        pdf_path = tmp_pdf.name

    docx_path = pdf_path.replace(".pdf", ".docx")
    try:
        cv = Converter(pdf_path)
        cv.convert(docx_path, start=0, end=None)
        cv.close()
        with open(docx_path, "rb") as f:
            return f.read(), MIME["docx"], ".docx"
    finally:
        os.unlink(pdf_path)
        if os.path.exists(docx_path):
            os.unlink(docx_path)


def _docx_to_pdf(file_bytes: bytes) -> tuple[bytes, str, str]:
    from docx2pdf import convert

    with tempfile.NamedTemporaryFile(suffix=".docx", delete=False) as tmp_docx:
        tmp_docx.write(file_bytes)
        docx_path = tmp_docx.name

    pdf_path = docx_path.replace(".docx", ".pdf")
    try:
        convert(docx_path, pdf_path)
        with open(pdf_path, "rb") as f:
            return f.read(), MIME["pdf"], ".pdf"
    finally:
        os.unlink(docx_path)
        if os.path.exists(pdf_path):
            os.unlink(pdf_path)
