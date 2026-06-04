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


def _client_for(api_key=None):
    return anthropic.AsyncAnthropic(api_key=api_key) if api_key else _client


async def analyze(content, file_type: str, filename: str, api_key=None) -> dict:
    messages = (
        _vision_messages(content, filename)
        if isinstance(content, list)
        else _text_messages(content, filename, file_type)
    )

    response = await _client_for(api_key).messages.create(
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


_TRANSLATE_SYSTEM = """You are a professional translator. Translate the provided text preserving its structure.
- Keep paragraph breaks exactly as in the original
- Translate naturally, not word-by-word
- Return ONLY the translated text with no explanation or preamble"""


async def translate(content, file_type: str, filename: str, target_language: str, api_key=None) -> str:
    from services.translate_service import LANGUAGE_NAMES
    lang_name = LANGUAGE_NAMES.get(target_language, target_language)

    if isinstance(content, list):
        msg_content = [{"type": "text", "text": f"Translate this document to {lang_name}. Return only the translated text:"}]
        for img_b64 in content[:5]:
            msg_content.append({"type": "image", "source": {"type": "base64", "media_type": "image/png", "data": img_b64}})
        messages = [{"role": "user", "content": msg_content}]
    else:
        truncated = content[:60_000]
        messages = [{"role": "user", "content": f"Translate the following {file_type.upper()} document to {lang_name}. Return only the translated text:\n\n{truncated}"}]

    response = await _client_for(api_key).messages.create(
        model=MODEL,
        max_tokens=4096,
        system=_TRANSLATE_SYSTEM,
        messages=messages,
    )
    return response.content[0].text.strip()


_QA_SYSTEM = """You are a document quality assurance expert. Analyze documents for issues and return ONLY valid JSON — no markdown, no explanation.

Response schema:
{
  "overall_score": integer 0-100,
  "summary": "one sentence summary of document quality",
  "issues": [
    {
      "severity": "critical|warning|suggestion",
      "category": "placeholder|grammar|inconsistency|missing_section|formatting|other",
      "description": "clear description of the issue",
      "location": "where in the document (section, page, paragraph)"
    }
  ]
}

Severity guide:
- critical: unfilled placeholders ([NAME], {{FIELD}}, TBD, etc.), missing required sections, broken references
- warning: grammar/spelling errors, date/number inconsistencies, contradicting statements
- suggestion: style improvements, unclear phrasing, optional missing content"""


async def qa_check(content, file_type: str, filename: str, api_key=None) -> dict:
    if isinstance(content, list):
        text_parts = [{"type": "text", "text": f"Check quality of this scanned document '{filename}':"}]
        for img_b64 in content[:5]:
            text_parts.append({"type": "image", "source": {"type": "base64", "media_type": "image/png", "data": img_b64}})
        messages = [{"role": "user", "content": text_parts}]
    else:
        truncated = content[:50_000]
        messages = [{"role": "user", "content": f"Check quality of this {file_type.upper()} document named '{filename}':\n\n{truncated}"}]

    response = await _client_for(api_key).messages.create(
        model=MODEL,
        max_tokens=2048,
        system=_QA_SYSTEM,
        messages=messages,
    )

    raw = response.content[0].text.strip()
    return json.loads(raw)
