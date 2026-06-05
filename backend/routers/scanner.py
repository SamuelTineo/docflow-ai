import asyncio
import base64
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile

from deps import get_api_key
from limiter import limiter
from services.ai_service import extract_text_from_image

router = APIRouter()
MAX_SIZE = 10 * 1024 * 1024
IMAGE_EXTS = {"png", "jpg", "jpeg", "webp"}


@router.post("/extract/")
@limiter.limit("10/minute")
async def extract(
    request: Request,
    file: UploadFile = File(...),
    api_key: str | None = Depends(get_api_key),
):
    file_bytes = await file.read()

    if len(file_bytes) > MAX_SIZE:
        raise HTTPException(status_code=413, detail="Imagen demasiado grande (máx. 10 MB)")

    ext = Path(file.filename or "scan.jpg").suffix.lstrip(".").lower()
    if ext not in IMAGE_EXTS:
        raise HTTPException(status_code=400, detail="Solo se aceptan imágenes (PNG, JPG, WEBP)")

    media_type = "image/jpeg" if ext in ("jpg", "jpeg") else f"image/{ext}"
    img_b64 = base64.standard_b64encode(file_bytes).decode()

    try:
        text = await extract_text_from_image(img_b64, media_type, api_key=api_key)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al procesar la imagen: {e}")

    return {"text": text, "word_count": len(text.split())}
