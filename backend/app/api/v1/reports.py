from html import escape
from io import BytesIO
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import HTMLResponse, StreamingResponse
from sqlalchemy.orm import Session

from app.api.deps import get_db_session, get_owned_analysis_or_404
from app.api.v1.auth import get_current_user
from app.models import Recommendation, Score, User
from app.schemas.report import ReportRequest

router = APIRouter(prefix="/report", tags=["Reports"])


def _build_report_html(analysis, score, recommendations, include_recommendations: bool) -> str:
    website_url = escape(analysis.website.url if analysis.website else "Unknown website")
    category_scores = score.category_scores or {}
    category_rows = "".join(
        "<tr><td>{}</td><td>{}</td></tr>".format(
            escape(str(name).replace("_", " ").title()),
            escape(f"{value:.1f}/100" if isinstance(value, (int, float)) else "N/A"),
        )
        for name, value in category_scores.items()
    ) or '<tr><td colspan="2">No category measurements available</td></tr>'

    recommendation_rows = ""
    if include_recommendations:
        recommendation_rows = "".join(
            "<li><strong>{}</strong> — {}<br><small>Priority: {}</small></li>".format(
                escape(item.issue),
                escape(item.description),
                escape(item.priority),
            )
            for item in recommendations
        )
        if not recommendation_rows:
            recommendation_rows = "<li>No saved recommendations are available for this assessment.</li>"

    explanation = escape(score.explanation or (
        "This heuristic score summarizes the measurements available to WebIntel."
    ))
    created = escape(str(analysis.completed_at or analysis.created_at))

    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>WebIntel Assessment Report</title>
<style>
body{{font-family:Arial,sans-serif;max-width:900px;margin:40px auto;padding:0 24px;color:#172033;line-height:1.55}}
h1,h2{{color:#172554}} .score{{font-size:38px;font-weight:700}} .muted{{color:#64748b}}
table{{width:100%;border-collapse:collapse;margin:16px 0}}td,th{{border-bottom:1px solid #e2e8f0;padding:10px;text-align:left}}
li{{margin:12px 0}} .notice{{background:#f1f5f9;padding:14px;border-radius:8px}}
@media print{{body{{margin:0 auto}}}}
</style>
</head>
<body>
<h1>WebIntel Website Assessment</h1>
<p class="muted">Generated from saved assessment data · {created}</p>
<h2>Website</h2><p>{website_url}</p>
<h2>Executive summary</h2>
<div class="score">{score.overall_score:.1f}<span class="muted"> / 100</span></div>
<p>Grade: <strong>{escape(str(score.grade))}</strong></p>
<p>{explanation}</p>
<p class="muted">Measurement coverage: {score.confidence * 100:.1f}%. This is a heuristic assessment, not an industry benchmark or a prediction of search rankings.</p>
<h2>Category breakdown</h2>
<table><thead><tr><th>Category</th><th>Score</th></tr></thead><tbody>{category_rows}</tbody></table>
<h2>Recommendations</h2><ul>{recommendation_rows}</ul>
<div class="notice">Only measurements and recommendations saved for this assessment are included. Missing measurements are not inferred.</div>
</body></html>"""


@router.post("/pdf")
def generate_report(
    payload: ReportRequest,
    db: Session = Depends(get_db_session),
    user: User = Depends(get_current_user),
):
    """Generate an HTML report or a downloadable PDF for the authenticated owner."""
    analysis = get_owned_analysis_or_404(payload.analysis_id, user, db)

    if analysis.status != "completed":
        raise HTTPException(
            status_code=409,
            detail="A report can only be generated for a completed analysis.",
        )

    score = db.query(Score).filter(Score.analysis_id == analysis.id).first()
    if score is None:
        raise HTTPException(
            status_code=409,
            detail="No saved readiness score exists for this analysis. Calculate the score first.",
        )

    recommendations = []
    if payload.include_recommendations:
        recommendations = (
            db.query(Recommendation)
            .filter(Recommendation.analysis_id == analysis.id)
            .order_by(Recommendation.priority.asc(), Recommendation.created_at.asc())
            .all()
        )

    html = _build_report_html(
        analysis, score, recommendations, payload.include_recommendations
    )

    if payload.format == "html":
        return HTMLResponse(content=html)

    try:
        from reportlab.lib import colors
        from reportlab.lib.enums import TA_LEFT
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import mm
        from reportlab.platypus import (
            SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether
        )
    except ImportError as exc:
        raise HTTPException(
            status_code=500,
            detail="PDF generation dependency is unavailable on the backend.",
        ) from exc

    buffer = BytesIO()
    document = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=18 * mm,
        leftMargin=18 * mm,
        topMargin=18 * mm,
        bottomMargin=18 * mm,
        title="WebIntel Website Assessment",
        author="WebIntel",
    )
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(
        name="ReportMuted", parent=styles["Normal"], textColor=colors.HexColor("#64748b"),
        fontSize=9, leading=13,
    ))
    styles.add(ParagraphStyle(
        name="ReportScore", parent=styles["Title"], fontSize=30, leading=34,
        textColor=colors.HexColor("#1d4ed8"), alignment=TA_LEFT,
    ))

    def para(value, style="BodyText"):
        return Paragraph(str(value), styles[style])

    story = [
        para("WebIntel Website Assessment", "Title"),
        para("Executive report generated from saved assessment data", "ReportMuted"),
        Spacer(1, 8 * mm),
        para("Website", "Heading2"),
        para(escape(analysis.website.url if analysis.website else "Unknown website")),
        para("Assessment date: " + escape(str(analysis.completed_at or analysis.created_at)), "ReportMuted"),
        Spacer(1, 5 * mm),
        para("Digital Readiness Score", "Heading2"),
        para(f"{score.overall_score:.1f} / 100", "ReportScore"),
        para(f"Grade: <b>{escape(str(score.grade))}</b>"),
        para(escape(score.explanation or (
            "This heuristic score summarizes the measurements available to WebIntel."
        ))),
        para(
            f"Measurement coverage: {score.confidence * 100:.1f}%. "
            "This is not statistical confidence, an industry benchmark, or a prediction of search rankings.",
            "ReportMuted",
        ),
        Spacer(1, 5 * mm),
        para("Category Breakdown", "Heading2"),
    ]

    category_rows = [[para("<b>Category</b>"), para("<b>Score</b>")]]
    for name, value in (score.category_scores or {}).items():
        shown = f"{value:.1f}/100" if isinstance(value, (int, float)) else "N/A"
        category_rows.append([
            para(escape(str(name).replace("_", " ").title())),
            para(escape(shown)),
        ])
    if len(category_rows) == 1:
        category_rows.append([para("No category measurements available"), para("N/A")])

    category_table = Table(category_rows, colWidths=[115 * mm, 45 * mm], repeatRows=1)
    category_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#eaf1ff")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#172554")),
        ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#dbe3ef")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ]))
    story.extend([category_table, Spacer(1, 6 * mm), para("Recommendations", "Heading2")])

    if not payload.include_recommendations:
        story.append(para("Recommendations were excluded from this report."))
    elif not recommendations:
        story.append(para("No saved recommendations are available for this assessment."))
    else:
        for item in recommendations:
            block = [
                para(f"<b>{escape(item.issue)}</b>"),
                para(escape(item.description)),
                para(f"Priority: {escape(item.priority)}", "ReportMuted"),
            ]
            if item.why_it_matters:
                block.append(para("<b>Why it matters:</b> " + escape(item.why_it_matters)))
            if item.suggested_implementation:
                block.append(para(
                    "<b>Suggested implementation:</b> "
                    + escape(item.suggested_implementation)
                ))
            story.extend([KeepTogether(block), Spacer(1, 3 * mm)])

    story.extend([
        Spacer(1, 5 * mm),
        para(
            "WebIntel scores are heuristic indicators based on collected signals. "
            "They are not calibrated industry benchmarks and do not guarantee search visibility.",
            "ReportMuted",
        ),
    ])

    document.build(story)
    buffer.seek(0)
    filename = f"webintel-report-{analysis.id}.pdf"
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
