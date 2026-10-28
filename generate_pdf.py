import os
import re
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, Preformatted
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY

def build_pdf(md_path, pdf_path):
    with open(md_path, 'r', encoding='utf-8') as f:
        md_text = f.read()

    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=letter,
        rightMargin=45,
        leftMargin=45,
        topMargin=45,
        bottomMargin=45
    )

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=22,
        leading=26,
        textColor=colors.HexColor('#1E293B'),
        spaceAfter=6
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#4338CA'),
        spaceAfter=12
    )

    meta_style = ParagraphStyle(
        'MetaStyle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#64748B'),
        spaceAfter=14
    )

    h1_style = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=18,
        textColor=colors.HexColor('#1E293B'),
        spaceBefore=14,
        spaceAfter=8
    )

    h2_style = ParagraphStyle(
        'Heading2_Custom',
        parent=styles['Heading3'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=colors.HexColor('#334155'),
        spaceBefore=10,
        spaceAfter=4
    )

    body_style = ParagraphStyle(
        'Body_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=14,
        textColor=colors.HexColor('#1E293B'),
        spaceAfter=6
    )

    bullet_style = ParagraphStyle(
        'Bullet_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
        textColor=colors.HexColor('#334155'),
        leftIndent=15,
        spaceAfter=4
    )

    code_style = ParagraphStyle(
        'Code_Custom',
        parent=styles['Code'],
        fontName='Courier',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor('#0F172A'),
        backColor=colors.HexColor('#F1F5F9'),
        borderPadding=6,
        spaceBefore=6,
        spaceAfter=8
    )

    story = []
    lines = md_text.split('\n')
    in_code_block = False
    code_lines = []

    for line in lines:
        stripped = line.strip()

        # Code block handling
        if stripped.startswith('```'):
            if in_code_block:
                code_text = '\n'.join(code_lines)
                story.append(Preformatted(code_text, code_style))
                code_lines = []
                in_code_block = False
            else:
                in_code_block = True
                code_lines = []
            continue

        if in_code_block:
            code_lines.append(line)
            continue

        if not stripped:
            story.append(Spacer(1, 4))
            continue

        # Horizontal Rule
        if stripped in ['---', '***', '___']:
            story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#E2E8F0'), spaceAfter=8, spaceBefore=8))
            continue

        # Document Header
        if stripped.startswith('# '):
            story.append(Paragraph(stripped[2:], title_style))
        elif stripped.startswith('## '):
            story.append(Paragraph(stripped[3:], h1_style))
        elif stripped.startswith('### '):
            story.append(Paragraph(stripped[4:], h2_style))
        elif stripped.startswith('- ') or stripped.startswith('* '):
            content = stripped[2:]
            content = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', content)
            content = re.sub(r'\*(.*?)\*', r'<i>\1</i>', content)
            content = re.sub(r'`(.*?)`', r'<font face="Courier">\1</font>', content)
            story.append(Paragraph(f"• {content}", bullet_style))
        elif re.match(r'^\d+\.\s', stripped):
            num, rest = stripped.split('.', 1)
            rest = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', rest)
            rest = re.sub(r'\*(.*?)\*', r'<i>\1</i>', rest)
            rest = re.sub(r'`(.*?)`', r'<font face="Courier">\1</font>', rest)
            story.append(Paragraph(f"<b>{num}.</b> {rest.strip()}", bullet_style))
        else:
            p_text = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', stripped)
            p_text = re.sub(r'\*(.*?)\*', r'<i>\1</i>', p_text)
            p_text = re.sub(r'`(.*?)`', r'<font face="Courier">\1</font>', p_text)
            story.append(Paragraph(p_text, body_style))

    doc.build(story)
    print(f"Generated PDF successfully: {pdf_path}")

if __name__ == '__main__':
    md = os.path.join(os.path.dirname(__file__), 'HACKATHON_REPORT.md')
    pdf = os.path.join(os.path.dirname(__file__), 'ShareSphere_Hackathon_Report.pdf')
    build_pdf(md, pdf)
