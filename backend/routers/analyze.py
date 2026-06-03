from fastapi import APIRouter, UploadFile, File, HTTPException

router = APIRouter()


@router.post("/")
async def analyze_document(file: UploadFile = File(...)):
    raise HTTPException(status_code=501, detail="Módulo 1 — pendiente de implementación")
