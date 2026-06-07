from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from routers import analyze, translate, convert, qa_check, assistant, scanner
from database import init_db
from limiter import limiter


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(
    title="DocFlow AI",
    version="0.1.0",
    lifespan=lifespan,
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

from config import settings as _settings
_origins = [o.strip() for o in _settings.allowed_origins.split(",")] if _settings.allowed_origins != "*" else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=_settings.allowed_origins != "*",
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analyze.router, prefix="/api/analyze", tags=["analyze"])
app.include_router(translate.router, prefix="/api/translate", tags=["translate"])
app.include_router(convert.router, prefix="/api/convert", tags=["convert"])
app.include_router(qa_check.router, prefix="/api/qa", tags=["qa"])
app.include_router(assistant.router, prefix="/api/assistant", tags=["assistant"])
app.include_router(scanner.router, prefix="/api/scanner", tags=["scanner"])


@app.get("/health")
async def health():
    from config import settings
    return {"status": "ok", "version": "0.1.0", "use_mock": settings.use_mock}
