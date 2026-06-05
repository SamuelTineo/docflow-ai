import asyncio
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile
from fastapi.responses import Response

from deps import get_api_key
from limiter import limiter
from services.ai_service import translate_document
from services.document_service import SUPPORTED_EXTS, extract_content
from services.translate_service import LANGUAGE_NAMES, build_output_doc

router = APIRouter()
MAX_SIZE = 50 * 1024 * 1024


@router.post("/")
@limiter.limit("10/minute")
async def translate(
    request: Request,
    file: UploadFile = File(...),
    target_lang: str = Form("en"),
    api_key: str | None = Depends(get_api_key),
):
    file_bytes = await file.read()

    if len(file_bytes) > MAX_SIZE:
        raise HTTPException(status_code=413, detail="Archivo demasiado grande (máx. 50 MB)")

    ext = Path(file.filename or "").suffix.lstrip(".").lower()
    if ext not in SUPPORTED_EXTS:
        raise HTTPException(status_code=400, detail=f"Formato no soportado: .{ext}")

    if target_lang not in LANGUAGE_NAMES:
        raise HTTPException(status_code=400, detail=f"Idioma no soportado: {target_lang}")

    try:
        content, metadata = await asyncio.to_thread(extract_content, file_bytes, ext)
        translated_text = await translate_document(content, ext, file.filename or "document", target_lang, api_key=api_key)
        output_bytes, output_ext, mime = await asyncio.to_thread(
            build_output_doc, file_bytes, ext, translated_text, file.filename or "document"
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error durante la traducción: {e}")

    stem = Path(file.filename or "document").stem
    output_name = f"{stem}_translated_{target_lang}.{output_ext}"

    return Response(
        content=output_bytes,
        media_type=mime,
        headers={"Content-Disposition": f'attachment; filename="{output_name}"'},
    )
