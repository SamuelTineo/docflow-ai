from config import settings


def _use_mock(api_key: str | None) -> bool:
    return settings.use_mock and not api_key


async def analyze_document(content, file_type: str, filename: str, api_key: str | None = None) -> dict:
    if _use_mock(api_key):
        from services.mock_service import analyze
        return await analyze(content, file_type, filename)
    from services.claude_service import analyze
    return await analyze(content, file_type, filename, api_key=api_key)


async def qa_check_document(content, file_type: str, filename: str, api_key: str | None = None) -> dict:
    if _use_mock(api_key):
        from services.mock_service import qa_check
        return await qa_check(content, file_type, filename)
    from services.claude_service import qa_check
    return await qa_check(content, file_type, filename, api_key=api_key)


async def translate_document(content, file_type: str, filename: str, target_language: str, api_key: str | None = None) -> str:
    if _use_mock(api_key):
        from services.mock_service import translate
        return await translate(content, file_type, filename, target_language)
    from services.claude_service import translate
    return await translate(content, file_type, filename, target_language, api_key=api_key)
