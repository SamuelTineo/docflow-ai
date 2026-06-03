from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel

router = APIRouter()


@router.post("/")
async def translate_document(file: UploadFile = File(...), target_lang: str = "en"):
    raise HTTPException(status_code=501, detail="Módulo 2 — pendiente de implementación")
