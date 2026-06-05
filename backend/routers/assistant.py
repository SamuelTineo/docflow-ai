from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel
from typing import Optional

from deps import get_api_key
from limiter import limiter
from services.ai_service import assistant_chat

router = APIRouter()


class ConversationMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    active_module: Optional[str] = None
    document_name: Optional[str] = None
    module_output: Optional[str] = None
    conversation_history: list[ConversationMessage] = []
    message: str


class ChatResponse(BaseModel):
    answer: str
    suggested_module: Optional[str] = None


@router.post("/chat/", response_model=ChatResponse)
@limiter.limit("20/minute")
async def chat(request: Request, req: ChatRequest, api_key: str | None = Depends(get_api_key)):
    try:
        result = await assistant_chat(
            active_module=req.active_module,
            document_name=req.document_name,
            module_output=req.module_output,
            history=[m.model_dump() for m in req.conversation_history],
            message=req.message,
            api_key=api_key,
        )
        return result
    except Exception:
        return {"answer": "Lo siento, ocurrió un error. Intentá de nuevo.", "suggested_module": None}
