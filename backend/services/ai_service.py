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


async def generate_quiz_from_document(content, file_type: str, filename: str, num_questions: int = 5, api_key: str | None = None) -> dict:
    if _use_mock(api_key):
        from services.mock_service import generate_quiz
        return await generate_quiz(content, file_type, filename, num_questions)
    from services.claude_service import generate_quiz
    return await generate_quiz(content, file_type, filename, num_questions, api_key=api_key)


async def assistant_chat(active_module, document_name, module_output, history, message, api_key: str | None = None) -> dict:
    if _use_mock(api_key):
        from services.mock_service import assistant_chat as mock_chat
        return await mock_chat(active_module, document_name, module_output, history, message)
    from services.claude_service import assistant_chat as claude_chat
    return await claude_chat(active_module, document_name, module_output, history, message, api_key=api_key)


async def translate_document(content, file_type: str, filename: str, target_language: str, api_key: str | None = None) -> str:
    if _use_mock(api_key):
        from services.mock_service import translate
        return await translate(content, file_type, filename, target_language)
    from services.claude_service import translate
    return await translate(content, file_type, filename, target_language, api_key=api_key)
