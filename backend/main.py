from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from routers import analyze, translate, convert, qa_check
from database import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(
    title="DocFlow AI",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analyze.router, prefix="/api/analyze", tags=["analyze"])
app.include_router(translate.router, prefix="/api/translate", tags=["translate"])
app.include_router(convert.router, prefix="/api/convert", tags=["convert"])
app.include_router(qa_check.router, prefix="/api/qa", tags=["qa"])


@app.get("/health")
async def health():
    return {"status": "ok", "version": "0.1.0"}
