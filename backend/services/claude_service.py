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


_QUIZ_SYSTEM = """You are an educational assessment expert. Generate quiz questions from a document and return ONLY valid JSON — no markdown, no explanation.

Response schema:
{
  "questions": [
    {
      "question": "Question text",
      "answer": "Answer text (1-3 sentences)"
    }
  ]
}

Guidelines:
- Questions should test key concepts, facts, and relationships in the document
- Answers should be concise but complete
- Vary question types (factual, conceptual, analytical)
- Generate all questions in the same language as the document"""


async def generate_quiz(content, file_type: str, filename: str, num_questions: int = 5, api_key=None) -> dict:
    if isinstance(content, list):
        msg_content = [{"type": "text", "text": f"Generate {num_questions} quiz questions from this document '{filename}':"}]
        for img_b64 in content[:5]:
            msg_content.append({"type": "image", "source": {"type": "base64", "media_type": "image/png", "data": img_b64}})
        messages = [{"role": "user", "content": msg_content}]
    else:
        truncated = content[:50_000]
        messages = [{"role": "user", "content": f"Generate {num_questions} quiz questions from this {file_type.upper()} document named '{filename}':\n\n{truncated}"}]

    response = await _client_for(api_key).messages.create(
        model=MODEL,
        max_tokens=2048,
        system=_QUIZ_SYSTEM,
        messages=messages,
    )
    return json.loads(response.content[0].text.strip())


_MC_QUIZ_SYSTEM = """You are an educational assessment expert. Generate multiple-choice quiz questions from a document and return ONLY valid JSON — no markdown, no explanation.

Response schema:
{
  "questions": [
    {
      "question": "Question text",
      "options": {"A": "option text", "B": "option text", "C": "option text", "D": "option text"},
      "correct": "A|B|C|D",
      "answer": "Brief explanation of why the correct answer is right (1-2 sentences)"
    }
  ]
}

Guidelines:
- Each question must have exactly 4 options (A, B, C, D)
- Only one option is correct
- Wrong options must be plausible but clearly incorrect
- Vary difficulty across questions
- Generate all content in the same language as the document"""


async def generate_mc_quiz(content, file_type: str, filename: str, num_questions: int = 5, api_key=None) -> dict:
    if isinstance(content, list):
        msg_content = [{"type": "text", "text": f"Generate {num_questions} multiple-choice questions from this document '{filename}':"}]
        for img_b64 in content[:5]:
            msg_content.append({"type": "image", "source": {"type": "base64", "media_type": "image/png", "data": img_b64}})
        messages = [{"role": "user", "content": msg_content}]
    else:
        truncated = content[:50_000]
        messages = [{"role": "user", "content": f"Generate {num_questions} multiple-choice questions from this {file_type.upper()} document named '{filename}':\n\n{truncated}"}]

    response = await _client_for(api_key).messages.create(
        model=MODEL, max_tokens=2048, system=_MC_QUIZ_SYSTEM, messages=messages,
    )
    return json.loads(response.content[0].text.strip())


_OCR_SYSTEM = """You are an OCR engine. Extract ALL text from the provided image exactly as it appears.
- Preserve original line breaks and formatting
- Include every word: titles, body, footnotes, captions, watermarks
- If there is a table, represent it in plain text with spacing
- Do NOT summarize, translate, or interpret — only transcribe
- Return ONLY the extracted text, nothing else"""


async def extract_text_from_scan(img_b64: str, media_type: str, api_key=None) -> str:
    messages = [{"role": "user", "content": [
        {"type": "text", "text": "Extract all text from this image:"},
        {"type": "image", "source": {"type": "base64", "media_type": media_type, "data": img_b64}},
    ]}]
    response = await _client_for(api_key).messages.create(
        model=MODEL, max_tokens=4096, system=_OCR_SYSTEM, messages=messages,
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


_ASSISTANT_SYSTEM = """You are a strictly scoped assistant for DocFlow AI, a document processing application.

YOUR ONLY ALLOWED TOPICS:
1. How to use DocFlow AI and its modules (analyze, translate, convert, qa)
2. Content and analysis of the document the user has uploaded in this session

HARD RULES:
- If the question is not about DocFlow AI or the uploaded document, respond ONLY with: "Solo puedo responder preguntas sobre DocFlow AI o sobre el documento que subiste." (or in the user's language).
- Never answer general knowledge questions, coding help, math, current events, or anything unrelated to the app or the uploaded document.
- Never pretend to be a general-purpose assistant.
- Be concise: 1-3 sentences max.
- Always answer in the same language the user writes in.
- If the user clearly intends to use a different module, end your response with exactly: SUGGEST_MODULE:module_name (one of: analyze, translate, convert, qa)

Available modules:
- analyze: Document Intelligence — auto summary, entity extraction, quiz generator
- translate: AI Translator — translate to 8 languages preserving layout
- convert: Format Converter — PDF↔DOCX, PPTX→PDF, images→PDF
- qa: QA Checker — detect placeholders, grammar errors, inconsistencies"""


async def assistant_chat(active_module, document_name, module_output, history, message, api_key=None) -> dict:
    context_parts = []
    if active_module:
        context_parts.append(f"Current module: {active_module}")
    if document_name:
        context_parts.append(f"Document: {document_name}")
    if module_output:
        context_parts.append(f"Module output:\n{module_output[:2000]}")
    context_str = "\n".join(context_parts) if context_parts else "No document loaded."

    system = f"{_ASSISTANT_SYSTEM}\n\nContext:\n{context_str}"
    messages = [{"role": m["role"], "content": m["content"]} for m in history[-8:]]
    messages.append({"role": "user", "content": message})

    response = await _client_for(api_key).messages.create(
        model=MODEL, max_tokens=512, system=system, messages=messages,
    )

    text = response.content[0].text.strip()
    suggested = None
    for mod in ['analyze', 'translate', 'convert', 'qa']:
        marker = f"SUGGEST_MODULE:{mod}"
        if marker in text:
            suggested = mod
            text = text.replace(marker, "").strip()
            break

    return {"answer": text, "suggested_module": suggested}


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
