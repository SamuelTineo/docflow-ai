from fastapi import APIRouter, UploadFile, File, HTTPException

router = APIRouter()


@router.post("/")
async def convert_document(file: UploadFile = File(...), target_format: str = "pdf"):
    raise HTTPException(status_code=501, detail="Módulo 3 — pendiente de implementación")
