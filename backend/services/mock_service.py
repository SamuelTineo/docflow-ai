import random

_ANALYZE_RESPONSES = [
    {
        "document_type": "contract",
        "language": "es",
        "summary": "Contrato de prestación de servicios entre Empresa ABC S.A. y Juan Pérez, con vigencia desde el 1 de enero de 2025 hasta el 31 de diciembre de 2025. El contratista prestará servicios de desarrollo de software por un monto mensual de $3.500 USD. Incluye cláusulas de confidencialidad y propiedad intelectual.",
        "structure": {
            "sections": ["Partes intervinientes", "Objeto del contrato", "Plazo y vigencia", "Honorarios y forma de pago", "Confidencialidad", "Propiedad intelectual", "Rescisión", "Jurisdicción"],
            "has_tables": False,
            "estimated_pages": 4,
        },
        "key_entities": {
            "dates": ["01/01/2025", "31/12/2025"],
            "amounts": ["$3.500 USD", "$42.000 USD anuales"],
            "people": ["Juan Pérez", "María González"],
            "organizations": ["Empresa ABC S.A.", "Ministerio de Trabajo"],
            "locations": ["Ciudad Autónoma de Buenos Aires", "Argentina"],
        },
        "quality_flags": {"is_scanned": False, "language_confidence": "high"},
    },
    {
        "document_type": "invoice",
        "language": "en",
        "summary": "Invoice #INV-2025-0042 issued by TechSolutions Ltd to Acme Corporation for cloud infrastructure services rendered during Q1 2025. Total amount due is $12,750.00 USD with net-30 payment terms. Includes itemized breakdown of compute, storage, and support services.",
        "structure": {
            "sections": ["Invoice Header", "Bill To", "Service Details", "Pricing Breakdown", "Payment Terms", "Notes"],
            "has_tables": True,
            "estimated_pages": 2,
        },
        "key_entities": {
            "dates": ["March 31, 2025", "April 30, 2025"],
            "amounts": ["$8,500.00", "$3,000.00", "$1,250.00", "$12,750.00"],
            "people": ["John Smith", "Sarah Connor"],
            "organizations": ["TechSolutions Ltd", "Acme Corporation"],
            "locations": ["San Francisco, CA", "New York, NY"],
        },
        "quality_flags": {"is_scanned": False, "language_confidence": "high"},
    },
    {
        "document_type": "report",
        "language": "es",
        "summary": "Informe trimestral de desempeño financiero correspondiente al Q2 2025. Muestra un crecimiento del 18% en ingresos respecto al trimestre anterior, impulsado principalmente por el segmento de servicios digitales. Se identifican oportunidades de mejora en la eficiencia operacional y reducción de costos logísticos.",
        "structure": {
            "sections": ["Resumen ejecutivo", "Indicadores clave (KPIs)", "Análisis de ingresos", "Análisis de costos", "Comparativa interanual", "Proyecciones Q3 2025", "Conclusiones y recomendaciones"],
            "has_tables": True,
            "estimated_pages": 12,
        },
        "key_entities": {
            "dates": ["Q2 2025", "Junio 2025", "Julio 2025"],
            "amounts": ["$2.4M", "18%", "$340.000"],
            "people": ["Diego Ramírez", "Lucía Fernández"],
            "organizations": ["Departamento de Finanzas", "Auditoría Interna"],
            "locations": ["Buenos Aires", "Rosario"],
        },
        "quality_flags": {"is_scanned": False, "language_confidence": "high"},
    },
]


async def analyze(content, file_type: str, filename: str) -> dict:
    return random.choice(_ANALYZE_RESPONSES)


async def qa_check(content, file_type: str, filename: str) -> dict:
    return {
        "overall_score": 72,
        "issues": [
            {"severity": "critical", "category": "placeholder", "description": "Campo sin completar: '[NOMBRE_CLIENTE]' en la sección 2.", "location": "Sección 2, párrafo 1"},
            {"severity": "warning", "category": "grammar", "description": "Inconsistencia en el uso de mayúsculas para el término 'contrato' / 'Contrato'.", "location": "Múltiples secciones"},
            {"severity": "suggestion", "category": "structure", "description": "La sección de 'Anexos' está referenciada pero no incluida en el documento.", "location": "Cláusula 8"},
        ],
        "summary": "El documento presenta 1 error crítico, 1 advertencia y 1 sugerencia de mejora.",
    }


async def generate_quiz(content, file_type: str, filename: str, num_questions: int = 5) -> dict:
    import asyncio
    await asyncio.sleep(0.5)
    questions = [
        {"question": "¿Cuál es el objeto principal de este documento?", "answer": "El documento describe los términos y condiciones acordados entre las partes, incluyendo plazos, montos y obligaciones de cada uno."},
        {"question": "¿Qué cláusulas de protección se mencionan?", "answer": "Se incluyen cláusulas de confidencialidad, propiedad intelectual y condiciones de rescisión del contrato."},
        {"question": "¿Cuáles son los plazos establecidos?", "answer": "El acuerdo tiene vigencia desde el 1 de enero de 2025 hasta el 31 de diciembre de 2025, con posibilidad de renovación."},
        {"question": "¿Cuál es el monto económico involucrado?", "answer": "$3.500 USD mensuales, equivalente a $42.000 USD anuales por los servicios prestados."},
        {"question": "¿Qué ocurre ante un incumplimiento del contrato?", "answer": "La parte afectada puede iniciar el proceso de rescisión con previo aviso de 30 días, con posibilidad de reclamar daños y perjuicios."},
        {"question": "¿Quiénes son las partes involucradas en el acuerdo?", "answer": "El contrato es celebrado entre Empresa ABC S.A. como comitente y Juan Pérez como contratista, ambos domiciliados en Argentina."},
        {"question": "¿Qué tipo de servicios se prestan según el documento?", "answer": "Servicios de desarrollo de software, prestados de forma independiente por el contratista bajo las condiciones pactadas."},
        {"question": "¿Cómo se regula la propiedad intelectual de los entregables?", "answer": "Todo trabajo producido durante la vigencia del contrato es propiedad exclusiva del comitente, quien retiene todos los derechos."},
        {"question": "¿Bajo qué jurisdicción se resuelven los conflictos?", "answer": "Cualquier disputa se resuelve ante los tribunales ordinarios de la Ciudad Autónoma de Buenos Aires, Argentina."},
        {"question": "¿El contrato permite la subcontratación?", "answer": "El documento no especifica explícitamente la posibilidad de subcontratar, por lo que se entiende que el contratista debe cumplir personalmente con las obligaciones pactadas."},
    ]
    return {"questions": questions[:num_questions]}


_APP_KEYWORDS = [
    'traduc', 'translat', 'analiz', 'convert', 'calidad', 'quality', 'revisar',
    'resumen', 'summary', 'quiz', 'preguntas', 'formato', 'pdf', 'docx', 'word',
    'módulo', 'module', 'app', 'docflow', 'documento', 'document', 'archivo', 'file',
    'error', 'problema', 'sección', 'entidad', 'fecha', 'monto', 'organiz',
]

async def assistant_chat(active_module, document_name, module_output, history, message) -> dict:
    import asyncio
    await asyncio.sleep(0.3)
    msg = message.lower()

    has_app_context = any(w in msg for w in _APP_KEYWORDS) or document_name or active_module
    if not has_app_context:
        return {"answer": "Solo puedo responder preguntas sobre DocFlow AI o sobre el documento que subiste.", "suggested_module": None}

    if any(w in msg for w in ['traduc', 'translat']):
        return {"answer": "Parece que querés traducir este documento. El Traductor IA preserva el formato original al traducir a 8 idiomas.", "suggested_module": "translate"}
    if any(w in msg for w in ['error', 'problema', 'calidad', 'quality', 'revisar']):
        return {"answer": "Para detectar errores, placeholders sin completar e inconsistencias, el Verificador de calidad es la herramienta indicada.", "suggested_module": "qa"}
    if any(w in msg for w in ['convertir', 'convert', 'formato', 'format', 'pdf', 'word', 'docx']):
        return {"answer": "Para convertir entre formatos (PDF ↔ DOCX, PPTX → PDF, imágenes → PDF), usá el Conversor de formatos.", "suggested_module": "convert"}
    if any(w in msg for w in ['analiz', 'resumen', 'summary', 'quiz', 'preguntas']):
        return {"answer": "Para obtener un resumen inteligente y generar preguntas a partir del documento, usá Inteligencia de documentos.", "suggested_module": "analyze"}
    if document_name:
        return {"answer": f"Tenés cargado '{document_name}'. ¿Querés analizarlo, traducirlo, convertirlo o revisar su calidad?", "suggested_module": None}
    return {"answer": "Soy el asistente de DocFlow AI. Subí un documento y preguntame sobre él, o consultame qué módulo usar para tu tarea.", "suggested_module": None}


async def translate(content, file_type: str, filename: str, target_language: str) -> str:
    return (
        f"[MOCK TRANSLATION — {target_language.upper()}]\n\n"
        "This is the first translated paragraph. The document has been successfully processed "
        "and its content translated into the target language.\n\n"
        "This is the second paragraph. It contains sample translated text that demonstrates "
        "how the output document will look once real translation is enabled.\n\n"
        "Third section: Additional content from the original document appears here, "
        "translated and formatted for readability."
    )
