import asyncio
import io
from pathlib import Path

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import StreamingResponse

from services.convert_service import get_supported_targets, run_conversion

router = APIRouter()

MAX_SIZE_BYTES = 50 * 1024 * 1024


@router.get("/formats")
async def formats(file_ext: str):
    targets = get_supported_targets(file_ext)
    if not targets:
        raise HTTPException(status_code=400, detail=f"Formato no soportado: {file_ext}")
    return {"targets": targets}


@router.post("/")
async def convert_document(
    file: UploadFile = File(...),
    target_format: str = Form(...),
):
    file_bytes = await file.read()
    if len(file_bytes) > MAX_SIZE_BYTES:
        raise HTTPException(status_code=413, detail="Archivo demasiado grande (máx. 50 MB)")

    source_ext = Path(file.filename or "").suffix.lstrip(".")
    if not source_ext:
        raise HTTPException(status_code=400, detail="No se pudo determinar el formato del archivo")

    try:
        result_bytes, mime_type, suffix = await asyncio.to_thread(
            run_conversion, file_bytes, source_ext, target_format
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error durante la conversión: {e}")

    stem = Path(file.filename or "file").stem
    filename = f"{stem}_converted{suffix}"

    return StreamingResponse(
        io.BytesIO(result_bytes),
        media_type=mime_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
