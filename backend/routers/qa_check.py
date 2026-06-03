from fastapi import APIRouter, UploadFile, File, HTTPException

router = APIRouter()


@router.post("/")
async def qa_check_document(file: UploadFile = File(...)):
    raise HTTPException(status_code=501, detail="Módulo 4 — pendiente de implementación")
