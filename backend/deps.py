from fastapi import Header
from config import settings


def get_api_key(x_claude_key: str = Header(default="")) -> str | None:
    return x_claude_key.strip() or None
