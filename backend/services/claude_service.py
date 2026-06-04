import json

import anthropic

from config import settings

_client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
MODEL = "claude-sonnet-4-6"

_SYSTEM = """You are a document analysis expert. Analyze documents and return ONLY valid JSON — no markdown, no explanation.

Response schema:
{
  "document_type": "contract|invoice|report|presentation|letter|form|other",
  "language": "ISO 639-1 code",
  "summary": "2-4 sentence summary in the document's language",
  "structure": {
    "sections": ["list of main section titles or topics"],
    "has_tables": boolean,
    "estimated_pages": integer or null
  },
  "key_entities": {
    "dates": [],
    "amounts": [],
    "people": [],
    "organizations": [],
    "locations": []
  },
  "quality_flags": {
    "is_scanned": boolean,
    "language_confidence": "high|medium|low"
  }
}"""


async def analyze(content, file_type: str, filename: str) -> dict:
    messages = (
        _vision_messages(content, filename)
        if isinstance(content, list)
        else _text_messages(content, filename, file_type)
    )

    response = await _client.messages.create(
        model=MODEL,
        max_tokens=2048,
        system=_SYSTEM,
        messages=messages,
    )

    raw = response.content[0].text.strip()
    return json.loads(raw)


def _text_messages(text: str, filename: str, file_type: str) -> list:
    truncated = text[:50_000]
    return [{"role": "user", "content": f"Analyze this {file_type.upper()} document named '{filename}':\n\n{truncated}"}]


def _vision_messages(images: list, filename: str) -> list:
    content = [{"type": "text", "text": f"Analyze this scanned document named '{filename}':"}]
    for img_b64 in images[:5]:
        content.append({
            "type": "image",
            "source": {"type": "base64", "media_type": "image/png", "data": img_b64},
        })
    return [{"role": "user", "content": content}]
