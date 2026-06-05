import asyncio
import json
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile

from deps import get_api_key
from limiter import limiter
from services.ai_service import analyze_document, generate_quiz_from_document
from services.document_service import SUPPORTED_EXTS, extract_content

router = APIRouter()
MAX_SIZE = 50 * 1024 * 1024


@router.post("/")
@limiter.limit("10/minute")
async def analyze(request: Request, file: UploadFile = File(...), api_key: str | None = Depends(get_api_key)):
    file_bytes = await file.read()

    if len(file_bytes) > MAX_SIZE:
        raise HTTPException(status_code=413, detail="Archivo demasiado grande (máx. 50 MB)")

    ext = Path(file.filename or "").suffix.lstrip(".").lower()
    if ext not in SUPPORTED_EXTS:
        raise HTTPException(status_code=400, detail=f"Formato no soportado: .{ext}")

    try:
        content, metadata = await asyncio.to_thread(extract_content, file_bytes, ext)
        analysis = await analyze_document(content, ext, file.filename or "document", api_key=api_key)
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="La IA devolvió una respuesta inesperada. Intentá de nuevo.")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error durante el análisis: {e}")

    return {"filename": file.filename, "metadata": metadata, "analysis": analysis}


@router.post("/quiz/")
@limiter.limit("10/minute")
async def quiz(
    request: Request,
    file: UploadFile = File(...),
    num_questions: int = Form(default=5),
    api_key: str | None = Depends(get_api_key),
):
    file_bytes = await file.read()

    if len(file_bytes) > MAX_SIZE:
        raise HTTPException(status_code=413, detail="Archivo demasiado grande (máx. 50 MB)")

    ext = Path(file.filename or "").suffix.lstrip(".").lower()
    if ext not in SUPPORTED_EXTS:
        raise HTTPException(status_code=400, detail=f"Formato no soportado: .{ext}")

    try:
        content, _ = await asyncio.to_thread(extract_content, file_bytes, ext)
        result = await generate_quiz_from_document(content, ext, file.filename or "document", num_questions, api_key=api_key)
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="La IA devolvió una respuesta inesperada. Intentá de nuevo.")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al generar el quiz: {e}")

    return result
