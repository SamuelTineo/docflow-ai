# DocFlow AI

Aplicación web de procesamiento inteligente de documentos con IA.

## Stack técnico

- **Frontend:** React + Tailwind CSS
- **Backend:** Python + FastAPI
- **IA:** Claude API (`claude-sonnet-4-6`)
- **Storage:** local por ahora, luego S3
- **Base de datos:** SQLite por ahora, luego PostgreSQL
- **Pagos (futuro):** Stripe

## Estructura del proyecto

```
docflow-ai/
├── frontend/
│   └── src/
│       ├── components/
│       ├── pages/
│       └── services/
├── backend/
│   ├── main.py
│   ├── routers/
│   │   ├── analyze.py
│   │   ├── translate.py
│   │   ├── convert.py
│   │   └── qa_check.py
│   ├── services/
│   │   ├── claude_service.py
│   │   ├── pdf_service.py
│   │   ├── docx_service.py
│   │   └── image_service.py
│   └── models/
└── CLAUDE.md
```

## Módulos

### Módulo 1 — Document Analyzer
- Input: PDF, DOCX, PPTX, imágenes (PNG, JPG)
- Proceso: extrae texto y estructura con OCR + Claude API
- Output: JSON estructurado + resumen en lenguaje natural + reporte de estructura

### Módulo 2 — AI Translator
- Input: cualquier documento + idioma destino
- Proceso: extrae texto preservando layout → traduce con Claude API → reconstruye documento
- Output: documento traducido en el mismo formato que el input
- Idiomas: EN, ES, PT, FR, DE, IT, ZH, JA (expandible)

### Módulo 3 — Format Converter
- PDF → DOCX, DOCX → PDF, PPTX → PDF, PDF ↔ imagen
- Preserva formato y calidad. Sin IA.

### Módulo 4 — QA Document Checker
- Input: cualquier documento
- Proceso: Claude API detecta inconsistencias, placeholders sin completar, errores gramaticales, secciones faltantes
- Output: reporte de calidad con severidad (crítico / advertencia / sugerencia)

## Reglas de desarrollo

1. Cada módulo es independiente pero comparte la arquitectura base
2. Manejo de errores robusto en todos los endpoints
3. Validación de tipos con Pydantic en FastAPI
4. El frontend debe mostrar progreso en tiempo real (loading states)
5. Código listo para producción, no solo demo
6. Cada módulo completado va en su propio commit

## Estado del proyecto

- Módulo 1 — Document Analyzer: pendiente
- Módulo 2 — AI Translator: pendiente
- Módulo 3 — Format Converter: pendiente
- Módulo 4 — QA Document Checker: pendiente

## Orden de construcción

1. Setup base (actual)
2. Módulo 3 — Format Converter (sin IA, valida el pipeline)
3. Módulo 1 — Document Analyzer (introduce Claude API)
4. Módulo 4 — QA Checker (construye sobre el analyzer)
5. Módulo 2 — AI Translator (el más complejo)
6. UI/UX pulido
7. Auth + Stripe
