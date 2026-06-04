import asyncio
import json
from pathlib import Path

from fastapi import APIRouter, File, HTTPException, UploadFile

from services.ai_service import qa_check_document
from services.document_service import SUPPORTED_EXTS, extract_content

router = APIRouter()
MAX_SIZE = 50 * 1024 * 1024


@router.post("/")
async def qa_check(file: UploadFile = File(...)):
    file_bytes = await file.read()

    if len(file_bytes) > MAX_SIZE:
        raise HTTPException(status_code=413, detail="Archivo demasiado grande (máx. 50 MB)")

    ext = Path(file.filename or "").suffix.lstrip(".").lower()
    if ext not in SUPPORTED_EXTS:
        raise HTTPException(status_code=400, detail=f"Formato no soportado: .{ext}")

    try:
        content, metadata = await asyncio.to_thread(extract_content, file_bytes, ext)
        report = await qa_check_document(content, ext, file.filename or "document")
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="La IA devolvió una respuesta inesperada. Intentá de nuevo.")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error durante el análisis: {e}")

    return {"filename": file.filename, "metadata": metadata, "report": report}
