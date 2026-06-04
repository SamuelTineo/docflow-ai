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


async def translate(content, file_type: str, filename: str, target_language: str) -> dict:
    return {
        "translated_text": f"[MOCK] Translated content of '{filename}' to {target_language}.\n\nLorem ipsum translated paragraph 1.\n\nLorem ipsum translated paragraph 2.",
        "source_language": "es",
        "target_language": target_language,
        "word_count": 342,
    }
