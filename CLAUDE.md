# DocFlow AI

Aplicación web de procesamiento inteligente de documentos con IA.

## Stack técnico

- **Frontend:** React + Tailwind CSS + Vite (puerto 3000)
- **Backend:** Python + FastAPI (puerto 8000)
- **IA:** Claude API (`claude-sonnet-4-6`) vía `anthropic` SDK
- **Storage:** local por ahora, luego S3
- **Base de datos:** SQLite (inicializada, sin uso activo aún) → luego PostgreSQL
- **Pagos (futuro):** Stripe
- **i18n:** ESP / ENG / POR (contexto React, sin librería externa)

## Estructura real del proyecto

```
docflow-ai/
├── start.bat                        # Levanta backend + frontend + abre browser
├── icon.ico                         # Ícono del acceso directo de escritorio
├── frontend/
│   └── src/
│       ├── App.jsx                  # Router, header, home (grilla 2×2 de módulos)
│       ├── main.jsx                 # Entry point, BrowserRouter + LanguageProvider
│       ├── i18n.js                  # Traducciones ESP/ENG/POR
│       ├── components/
│       │   ├── FileDropzone.jsx     # Dropzone reutilizable (react-dropzone)
│       │   └── MockBanner.jsx       # Banner demo + input de API key (sessionStorage)
│       ├── contexts/
│       │   └── LanguageContext.jsx  # Contexto de idioma + hook useLanguage()
│       ├── pages/
│       │   ├── Analyzer.jsx
│       │   ├── Translator.jsx
│       │   ├── Converter.jsx
│       │   └── QAChecker.jsx
│       └── services/
│           └── api.js               # axios + interceptor X-Claude-Key
├── backend/
│   ├── main.py                      # FastAPI app, CORS, routers, /health
│   ├── config.py                    # Pydantic settings (.env): API_KEY, USE_MOCK
│   ├── database.py                  # SQLite init (sin modelos activos aún)
│   ├── deps.py                      # Dependencia FastAPI: extrae X-Claude-Key del header
│   ├── routers/
│   │   ├── analyze.py
│   │   ├── translate.py
│   │   ├── convert.py
│   │   └── qa_check.py
│   └── services/
│       ├── ai_service.py            # Router mock vs real (usa USE_MOCK o X-Claude-Key)
│       ├── claude_service.py        # Llamadas reales a Claude API (analyze, translate, qa_check)
│       ├── mock_service.py          # Respuestas simuladas para demo sin API key
│       ├── document_service.py      # Extracción de contenido: PDF, DOCX, PPTX, imágenes
│       ├── translate_service.py     # Reconstrucción de documentos traducidos (DOCX, PPTX)
│       └── convert_service.py       # Conversiones de formato sin IA
```

> **No existe** `backend/models/` — la DB está inicializada pero sin modelos activos todavía.

## Módulos — estado actual

### Módulo 1 — Document Analyzer ✅
- **Input:** PDF, DOCX, PPTX, PNG, JPG (máx. 50 MB)
- **Extracción:** texto nativo para PDF/DOCX/PPTX; fallback a visión (base64) para PDFs escaneados e imágenes
- **Output JSON completo:**
  ```json
  {
    "filename": "...",
    "metadata": { "pages": 4, "mode": "text|vision", "is_scanned": false },
    "analysis": {
      "document_type": "contract|invoice|report|presentation|letter|form|other",
      "language": "es",
      "summary": "2-4 oraciones en el idioma del documento",
      "structure": {
        "sections": ["lista de secciones detectadas"],
        "has_tables": true,
        "estimated_pages": 4
      },
      "key_entities": {
        "dates": [], "amounts": [], "people": [], "organizations": [], "locations": []
      },
      "quality_flags": { "is_scanned": false, "language_confidence": "high" }
    }
  }
  ```

### Módulo 2 — AI Translator ✅
- **Input:** PDF, DOCX, PPTX, PNG, JPG + idioma destino
- **Idiomas:** EN, ES, PT, FR, DE, IT, ZH, JA
- **Proceso:** extrae texto → traduce con Claude → reconstruye documento
- **Output:** archivo descargable. DOCX → DOCX (reemplaza párrafos preservando estilos), PPTX → PPTX, PDF/imagen → DOCX nuevo

### Módulo 3 — Format Converter ✅
- PDF → DOCX, DOCX → PDF, PPTX → PDF, PDF ↔ imagen (PNG/JPG)
- Sin IA. Usa `pymupdf`, `python-docx`, `pdf2docx`

### Módulo 4 — QA Document Checker ✅
- **Input:** PDF, DOCX, PPTX, PNG, JPG
- **Output:** score 0-100 + lista de issues con severidad (`critical` / `warning` / `suggestion`) y categoría (`placeholder`, `grammar`, `inconsistency`, `missing_section`, `formatting`)

## Demo mode (mock)

- `USE_MOCK=true` en `.env` → todas las llamadas a IA devuelven datos simulados
- El frontend detecta el modo via `/health` y muestra un banner amarillo
- Desde el banner el usuario puede ingresar su propia Claude API key → se guarda en `sessionStorage` (se olvida al cerrar la pestaña, nunca va al servidor) → el backend la usa vía header `X-Claude-Key`, bypaseando el mock

## Cómo levantar

```powershell
# Backend
cd backend
.\.venv\Scripts\uvicorn.exe main:app --reload --port 8000

# Frontend (otra terminal)
cd frontend
npm run dev
```

O doble clic en `start.bat` desde el escritorio.

## Variables de entorno (`backend/.env`)

```
ANTHROPIC_API_KEY=sk-ant-...   # Puede estar vacío si USE_MOCK=true
USE_MOCK=true                   # false para usar Claude real
UPLOAD_DIR=uploads
MAX_FILE_SIZE_MB=50
```

## Reglas de desarrollo

1. Cada módulo es independiente pero comparte `document_service` y `ai_service`
2. Manejo de errores robusto en todos los endpoints (HTTP 400/413/500)
3. Validación de tipos con Pydantic en FastAPI
4. El frontend muestra progreso en tiempo real (barra de progreso por etapas)
5. Código listo para producción, no solo demo
6. Cada módulo completado va en su propio commit

## Estado del proyecto

- ✅ Módulo 1 — Document Analyzer
- ✅ Módulo 2 — AI Translator
- ✅ Módulo 3 — Format Converter
- ✅ Módulo 4 — QA Document Checker
- ✅ UI/UX base (home 2×2, i18n ESP/ENG/POR, demo banner)
- ⏳ Auth (login / registro)
- ⏳ Stripe (planes de pago, límites de uso)
- ⏳ Historial de documentos procesados (requiere modelos DB)
- ⏳ Deploy (Railway / Render + S3)
