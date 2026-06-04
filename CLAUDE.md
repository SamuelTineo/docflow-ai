# DocFlow AI — CLAUDE.md

Context file for AI-assisted development. Read this before making any changes.

---

## Project Overview

DocFlow AI is an intelligent document processing web application.
Users upload documents and interact with them through AI-powered tools: analysis, translation, format conversion, and quality checking.

**Stack**
- Frontend: React + Tailwind CSS + i18n (ES / EN / PT)
- Backend: Python + FastAPI
- AI: Claude API (`claude-sonnet-4-20250514`) with mock fallback for demo
- Storage: local filesystem (S3 later)
- Database: SQLite (schema exists, models not yet implemented)

---

## Current Project Structure

```
docflow-ai/
├── frontend/
│   └── src/
│       ├── components/
│       │   └── MockBanner.jsx        # Demo banner shown when no API key
│       ├── contexts/
│       │   └── LanguageContext.jsx   # i18n context (ES/EN/PT)
│       ├── pages/                    # One page per module
│       ├── services/                 # API calls to backend
│       └── i18n.js                   # Translation strings
├── backend/
│   ├── main.py                       # FastAPI app entry point
│   ├── deps.py                       # API key dependency injection
│   ├── routers/
│   │   ├── analyze.py                # POST /api/analyze/
│   │   ├── translate.py              # POST /api/translate/
│   │   ├── convert.py                # POST /api/convert/
│   │   └── qa_check.py               # POST /api/qa/
│   └── services/
│       ├── document_service.py       # Content extraction (PDF, DOCX, PPTX, images)
│       ├── ai_service.py             # AI provider router (claude / mock)
│       ├── mock_service.py           # Simulated responses for demo mode
│       ├── translate_service.py      # Document reconstruction after translation
│       └── convert_service.py        # Format conversion logic
```

> `backend/models/` was never created. SQLite exists but has no active models yet.

---

## Module Status

| Module | Endpoint | Status | Notes |
|---|---|---|---|
| Document Analyzer | `POST /api/analyze/` | ✅ Complete | See output schema below |
| AI Translator | `POST /api/translate/` | ✅ Complete | Layout-preserving |
| Format Converter | `POST /api/convert/` | ✅ Complete | PDF↔DOCX, PPTX→PDF, img→PDF |
| QA Checker | `POST /api/qa/` | ✅ Complete | Severity levels: critical/warning/suggestion |

---

## Analyzer Output Schema

`POST /api/analyze/` returns:

```json
{
  "filename": "...",
  "metadata": {
    "pages": 4,
    "mode": "text",
    "is_scanned": false
  },
  "analysis": {
    "document_type": "contract|invoice|report|manual|other",
    "language": "es",
    "summary": "2-4 sentence summary",
    "structure": {
      "sections": ["list of detected sections"],
      "has_tables": true,
      "estimated_pages": 4
    },
    "key_entities": {
      "dates": [],
      "amounts": [],
      "people": [],
      "organizations": [],
      "locations": []
    },
    "quality_flags": {
      "is_scanned": false,
      "language_confidence": "high"
    }
  }
}
```

---

## Global AI Assistant (Contextual Chat)

A persistent floating chat button available on every page of the app.
This is NOT a module — it is a global UI component that provides contextual help throughout the entire app.

**Behavior by context:**

| User is on | Document loaded | Assistant behavior |
|---|---|---|
| Any module | No | Answers general questions about the app and suggests what to do |
| Any module | Yes | Answers questions about the loaded document and current output |
| Analyzer | Yes | Can also suggest switching to Quiz mode if question implies analysis |
| Translator | Yes | Can answer "why was this phrase translated this way?" |
| QA Checker | Yes | Can explain why a flag was raised and how to fix it |
| Converter | Yes | Can suggest the best format for the user's use case |

**Intent detection — navigation suggestions:**
If the user asks something that implies a different module, the assistant suggests it:
- "Can you translate this?" → "It looks like you want to translate this document. Go to Translator →"
- "Are there any errors in this?" → "Try the QA Checker for a full quality report. Go to QA →"
- "Give me a summary" → "The Analyzer already has a summary. Go to Document Intelligence →"

**Frontend implementation:**
- Floating button: fixed position, bottom-right corner, all pages
- Chat panel: slides up on click, shows message thread + input
- Context passed automatically from app state — user never needs to re-upload
- Component: `frontend/src/components/GlobalAssistant.jsx`
- Context hook: `frontend/src/contexts/AssistantContext.jsx`
  - Exposes: `{ activeModule, documentContent, moduleOutput, conversationHistory }`

**Backend:**
- Single endpoint: `POST /api/assistant/chat/`
- Receives:
```json
{
  "active_module": "analyze|translate|convert|qa",
  "document_content": "extracted text or null",
  "module_output": "current module result as string or null",
  "conversation_history": [],
  "message": "user message"
}
```
- Returns:
```json
{
  "answer": "assistant response",
  "suggested_module": "translate|qa|analyze|convert|null"
}
```
- Router: `backend/routers/assistant.py`

**Rules:**
- Always works in mock mode
- Never re-extracts document content — receives it from frontend state
- `suggested_module` is null unless there is a clear intent to switch
- Add i18n strings for placeholder text and default messages

---

## Pending Work — Priority Order

### 1. Refactor Module 1: Document Intelligence (replaces current Analyzer page)

The current Analyzer is a single-output tool. Refactor it into a unified
**Document Intelligence** module with three interaction modes:

**Auto Summary** (current behavior — keep as-is)
- Displays the existing analyzer output: summary, entities, structure, quality flags
- No changes needed to the backend

**Quiz Generator** (new)
- User clicks "Generate Quiz" after uploading a document
- Backend: new endpoint `POST /api/analyze/quiz/`
  - Receives: `{ document_content: str, num_questions: int (default 5) }`
  - Uses Claude API to generate relevant Q&A pairs
  - Returns: `{ questions: [{ question: str, answer: str }] }`
- Frontend: display as a card list with question visible and answer hidden (reveal on click)

**UI structure for the refactored page:**
```
📄 Document Intelligence
├── [Upload area — shared]
├── [Tab or toggle: Auto Summary | Quiz]
└── [Output area — changes based on selected mode]
```

Note: AI Chat was moved to the Global Assistant (see above) — it is no longer
a tab inside this module. The Quiz Generator is the only new mode here.

All modes share the same upload and extraction step.
Switch between modes without re-uploading.

### 2. Global AI Assistant component (after Module 1 refactor)

Implement the floating contextual chat as described in the Global AI Assistant section above.
Build in this order:
1. `AssistantContext.jsx` — app-wide state for active module + document + output
2. `backend/routers/assistant.py` — the chat endpoint
3. `GlobalAssistant.jsx` — floating button + chat panel UI
4. Wire context into all existing module pages so the assistant always has current state

---

### 3. Database models (after Module 1 refactor)

Implement SQLite models for:
- `Document` — id, filename, file_type, uploaded_at, content_text
- `AnalysisResult` — document_id, module (analyze/translate/convert/qa), result_json, created_at

Use SQLAlchemy. Add Alembic for migrations.
This will allow storing history and later supporting user accounts.

---

### 4. Auth + Stripe (future — do not implement yet)

- Auth: JWT-based, simple email/password
- Stripe: freemium model
  - Free: 5 documents/day, watermark on converted files
  - Pro ($12/mo): unlimited, no watermark, API access

---

## Development Rules

1. Never re-extract document content on follow-up requests — pass extracted text from frontend state
2. All FastAPI endpoints must use Pydantic models for request/response validation
3. All new features must work in mock mode (no API key required for demo)
4. Frontend must show loading states for all async operations
5. i18n: all new UI strings must be added to `i18n.js` in ES, EN, and PT
6. Keep each router focused — do not add business logic directly in route handlers
7. Commits: one commit per completed feature, descriptive message in English

---

## How to Run

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```
