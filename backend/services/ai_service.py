from config import settings


async def analyze_document(content, file_type: str, filename: str) -> dict:
    if settings.use_mock:
        from services.mock_service import analyze
        return await analyze(content, file_type, filename)

    provider = settings.ai_provider.lower()
    if provider == "claude":
        from services.claude_service import analyze
        return await analyze(content, file_type, filename)
    if provider == "gemini":
        from services.gemini_service import analyze
        return await analyze(content, file_type, filename)

    raise ValueError(f"AI provider desconocido: '{provider}'. Usar 'claude' o 'gemini'.")


async def qa_check_document(content, file_type: str, filename: str) -> dict:
    if settings.use_mock:
        from services.mock_service import qa_check
        return await qa_check(content, file_type, filename)

    provider = settings.ai_provider.lower()
    if provider == "claude":
        from services.claude_service import qa_check
        return await qa_check(content, file_type, filename)

    raise ValueError(f"AI provider desconocido: '{provider}'.")


async def translate_document(content, file_type: str, filename: str, target_language: str) -> dict:
    if settings.use_mock:
        from services.mock_service import translate
        return await translate(content, file_type, filename, target_language)

    provider = settings.ai_provider.lower()
    if provider == "claude":
        from services.claude_service import translate
        return await translate(content, file_type, filename, target_language)

    raise ValueError(f"AI provider desconocido: '{provider}'.")
