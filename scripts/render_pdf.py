import argparse
from pathlib import Path
import sys

# We prefer Playwright for high-fidelity printing (printBackground, CSS media)
# Usage examples:
#   python scripts/render_pdf.py --input public/cv.html --output resumes/resume-fasil-2025.pdf
#   python scripts/render_pdf.py -i public/cv.html -o out.pdf --format A4 --margin 10mm 10mm 10mm 10mm

def parse_args():
    p = argparse.ArgumentParser(description="Render an HTML file to PDF using Playwright (Chromium)")
    p.add_argument('-i', '--input', default=str(Path('public') / 'cv.html'), help='Input HTML file (default: public/cv.html)')
    p.add_argument('-o', '--output', default=str(Path('resumes') / 'resume-fasil-2025.pdf'), help='Output PDF file (default: resumes/resume-fasil-2025.pdf)')
    p.add_argument('--format', default='A4', help='Page format (default: A4)')
    p.add_argument('--landscape', action='store_true', help='Render in landscape orientation')
    p.add_argument('--margin', nargs=4, metavar=('TOP','RIGHT','BOTTOM','LEFT'), default=['10mm','10mm','10mm','10mm'], help='Page margins (default: 10mm 10mm 10mm 10mm)')
    p.add_argument('--no-background', action='store_true', help='Disable print background')
    p.add_argument('--timeout', type=int, default=60_000, help='Navigation timeout in ms (default: 60000)')
    return p.parse_args()


def ensure_playwright_installed():
    try:
        import playwright.sync_api as _  # noqa: F401
        return True
    except Exception:
        return False


def main():
    args = parse_args()

    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        sys.stderr.write("Playwright is not installed. Install with: pip install playwright\n")
        sys.stderr.write("Then run: python -m playwright install chromium\n")
        sys.exit(1)

    input_path = Path(args.input).resolve()
    if not input_path.exists():
        sys.stderr.write(f"Input HTML not found: {input_path}\n")
        sys.exit(1)

    output_path = Path(args.output).resolve()
    output_path.parent.mkdir(parents=True, exist_ok=True)

    # Convert margin args into dict
    top, right, bottom, left = args.margin
    margins = { 'top': top, 'right': right, 'bottom': bottom, 'left': left }

    with sync_playwright() as p:
        browser = p.chromium.launch()
        context = browser.new_context()
        page = context.new_page()

        # file:/// URL for local HTML
        file_url = input_path.as_uri()
        page.goto(file_url, wait_until='networkidle', timeout=args.timeout)

        # Ensure all fonts and images are loaded
        page.wait_for_load_state('networkidle')

        page.pdf(
            path=str(output_path),
            format=args.format,
            print_background=not args.no_background,
            landscape=args.landscape,
            margin=margins,
        )

        browser.close()

    print(f"PDF written to: {output_path}")


if __name__ == '__main__':
    main()
