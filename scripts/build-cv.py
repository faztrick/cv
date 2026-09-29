"""Export the maintained CV data to printable HTML and an ATS-friendly PDF."""
from pathlib import Path
from html import escape
import json
import re

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, KeepTogether

ROOT = Path(__file__).resolve().parents[1]
data = json.loads((ROOT / "data/cv-data.json").read_text(encoding="utf-8"))
person = data["personalInfo"]
output = ROOT / "output/pdf"
output.mkdir(parents=True, exist_ok=True)
static = ROOT / "frontend/static"
static.mkdir(parents=True, exist_ok=True)

def clean(value):
    return str(value).replace("**", "").replace("\u2011", "-").replace("\u2013", "-").replace("\u2014", "-")

def text(value):
    return escape(clean(value))

project_names = ["AI Sales Calling & Lead Management Platform", "Speech Transcription & Analysis Platform", "IdolMEA ERP", "AI Self-Checkout Kiosk", "Hybrid Sync Engine"]
projects = [next(p for p in data["projects"] if p["name"] == name) for name in project_names]
groups = data["skillGroups"]

experience_html = "".join(
    f'<article><div class="role-header"><h3>{text(job["role"])}</h3><span>{text(job["duration"])}</span></div>'
    f'<p class="company">{text(job["company"])} | {text(job["location"])}</p><ul>'
    + "".join(f'<li>{text(bullet)}</li>' for bullet in job["bullets"]) + '</ul></article>'
    for job in data["experience"]
)
projects_html = "".join(
    f'<article><h3>{text(project["name"])}</h3><p>{text(project["description"])}</p>'
    f'<p class="technology"><strong>Technologies:</strong> {text(", ".join(project["technologies"]))}</p></article>'
    for project in projects
)
education_html = "".join(f'<p><strong>{text(item["qualification"])}</strong><br>{text(item["institution"])} | {text(item["duration"])}</p>' for item in data["education"])
html = f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>{text(person['name'])} - Senior Full-Stack Engineer - CV</title>
<meta name="description" content="Updated professional CV: full-stack engineering, applied AI, speech processing, enterprise systems, and IoT.">
<link rel="icon" href="/favicon.svg"><link rel="stylesheet" href="/cv.css"></head>
<body><nav class="document-tools"><a href="/">Back to portfolio</a><a href="/resume.pdf" download>Download PDF</a><button id="print-cv">Print / save PDF</button></nav>
<main><header><p class="document-label">PROFESSIONAL CV · UPDATED SEPTEMBER 2026</p><h1>{text(person['name'])}</h1><p class="headline">{text(person['title'])}</p>
<p class="contact">{text(person['location'])} | <a href="mailto:{text(person['email'])}">{text(person['email'])}</a> | <a href="tel:{re.sub(r'[^+0-9]', '', person['phone'])}">{text(person['phone'])}</a><br>
{text(person['linkedin'])} | {text(person['github'])}</p></header>
<section><h2>Professional summary</h2><p>{text(data['summary'])}</p></section>
<section><h2>Technical skills</h2>{''.join(f'<p class="skill-group"><strong>{text(group)}:</strong> {text(", ".join(skills))}</p>' for group,skills in groups.items())}</section>
<section><h2>Professional experience</h2>{experience_html}</section>
<section><h2>Selected engineering projects</h2>{projects_html}</section>
<section><h2>Education</h2>{education_html}</section>
<section><h2>Additional highlights</h2><ul>{''.join(f'<li>{text(item)}</li>' for item in data['highlights'][:3])}</ul></section>
</main><script src="/print-cv.js"></script></body></html>'''
(static / "cv.html").write_text(html, encoding="utf-8")

# Embed a readable Unicode font; both Windows and Linux build hosts are supported.
font_pairs = [
    (Path("C:/Windows/Fonts/segoeui.ttf"), Path("C:/Windows/Fonts/segoeuib.ttf")),
    (Path("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"), Path("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf")),
]
for regular, bold in font_pairs:
    if regular.exists() and bold.exists():
        pdfmetrics.registerFont(TTFont("CVRegular", str(regular)))
        pdfmetrics.registerFont(TTFont("CVBold", str(bold)))
        pdfmetrics.registerFontFamily("CVRegular", normal="CVRegular", bold="CVBold")
        break
else:
    raise RuntimeError("Install Segoe UI or DejaVu Sans before exporting the CV")

green = colors.HexColor("#204d39")
ink = colors.HexColor("#242b27")
muted = colors.HexColor("#586358")
styles = {
    "name": ParagraphStyle("name", fontName="CVBold", fontSize=24, leading=29, textColor=green, spaceAfter=5),
    "title": ParagraphStyle("title", fontName="CVRegular", fontSize=11, leading=15, textColor=ink, spaceAfter=7),
    "contact": ParagraphStyle("contact", fontName="CVRegular", fontSize=8.1, leading=12, textColor=muted, spaceAfter=12),
    "section": ParagraphStyle("section", fontName="CVBold", fontSize=10, leading=14, textColor=green, spaceBefore=13, spaceAfter=7, keepWithNext=True),
    "body": ParagraphStyle("body", fontName="CVRegular", fontSize=9.1, leading=13.4, textColor=ink, spaceAfter=5, alignment=TA_LEFT),
    "role": ParagraphStyle("role", fontName="CVBold", fontSize=10, leading=14, textColor=ink, spaceBefore=5, spaceAfter=2, keepWithNext=True),
    "meta": ParagraphStyle("meta", fontName="CVRegular", fontSize=8.6, leading=12, textColor=muted, spaceAfter=5, keepWithNext=True),
    "bullet": ParagraphStyle("bullet", fontName="CVRegular", fontSize=9, leading=13, textColor=ink, leftIndent=10, firstLineIndent=-8, spaceAfter=3),
}
story = []
def add(value, style="body"):
    story.append(Paragraph(value, styles[style]))
def section(value):
    add(text(value.upper()), "section")

add(text(person["name"]), "name")
add(text(person["title"]), "title")
add(text(person["location"]) + " | " + text(person["email"]) + " | " + text(person["phone"]) + "<br/>" + text(person["linkedin"]) + " | " + text(person["github"]), "contact")
section("Professional summary")
add(text(data["summary"]))
section("Technical skills")
for group, skills in groups.items():
    add(f'<b>{text(group)}:</b> {text(", ".join(skills))}')
section("Professional experience")
for job in data["experience"]:
    add(text(job["role"]) + " | " + text(job["company"]), "role")
    add(text(job["duration"]) + " | " + text(job["location"]), "meta")
    for bullet in job["bullets"]:
        add("- " + text(bullet), "bullet")

story.append(PageBreak())
add(text(person["name"]), "name")
add("Selected engineering work", "title")
for project in projects:
    section(project["name"])
    add(text(project["description"]))
    for bullet in project.get("bullets", []):
        add("- " + text(bullet), "bullet")
    add('<b>Technologies:</b> ' + text(", ".join(project["technologies"])))
section("Education")
for item in data["education"]:
    add('<b>' + text(item["qualification"]) + '</b>')
    add(text(item["institution"]) + " | " + text(item["duration"]))
section("Additional highlights")
for item in data["highlights"][:3]:
    add("- " + text(item), "bullet")

def footer(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(colors.HexColor("#dce1d7"))
    canvas.line(44, 38, A4[0] - 44, 38)
    canvas.setFont("CVRegular", 7.5)
    canvas.setFillColor(muted)
    canvas.drawString(44, 25, "Updated 29 September 2026")
    canvas.drawRightString(A4[0] - 44, 25, str(doc.page))
    canvas.restoreState()

pdf = output / "Muhammed-Fasil-PV-CV.pdf"
doc = SimpleDocTemplate(str(pdf), pagesize=A4, rightMargin=44, leftMargin=44, topMargin=38, bottomMargin=50, title=f"{person['name']} - Professional CV", author=person['name'])
doc.build(story, onFirstPage=footer, onLaterPages=footer)
print("Generated printable HTML:", static / "cv.html")
print("Generated PDF:", pdf)
