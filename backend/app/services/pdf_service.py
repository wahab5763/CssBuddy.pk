import io
from typing import Optional

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle

from app.schemas.mcq import QuizSubmitResponse


def generate_quiz_pdf(subject: str, result: QuizSubmitResponse) -> bytes:
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, topMargin=2 * cm, bottomMargin=2 * cm)
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle("title", parent=styles["Heading1"], textColor=colors.HexColor("#4F46E5"))
    body_style = ParagraphStyle("body", parent=styles["Normal"], fontSize=10, leading=14)
    correct_style = ParagraphStyle("correct", parent=body_style, textColor=colors.green)
    wrong_style = ParagraphStyle("wrong", parent=body_style, textColor=colors.red)

    elements = [
        Paragraph(f"CssBuddy.pk — Quiz Results", title_style),
        Paragraph(f"Subject: {subject}", styles["Heading3"]),
        Paragraph(
            f"Score: {result.correct}/{result.total} ({result.score_pct}%)", styles["Heading3"]
        ),
        Spacer(1, 0.5 * cm),
    ]

    for i, r in enumerate(result.results, 1):
        color = colors.HexColor("#16a34a") if r.is_correct else colors.HexColor("#dc2626")
        q_style = ParagraphStyle(f"q{i}", parent=body_style, textColor=color)
        elements.append(Paragraph(f"Q{i}. {r.question}", q_style))
        for opt_letter, opt_text in [("A", r.option_a), ("B", r.option_b), ("C", r.option_c), ("D", r.option_d)]:
            if opt_text:
                marker = " ✓" if opt_letter == r.correct else (" ✗" if opt_letter == r.selected else "")
                elements.append(Paragraph(f"  {opt_letter}. {opt_text}{marker}", body_style))
        elements.append(Spacer(1, 0.3 * cm))

    doc.build(elements)
    return buf.getvalue()
