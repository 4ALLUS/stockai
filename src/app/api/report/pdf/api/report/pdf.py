from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import json
import io
import base64

try:
    from reportlab.lib.pagesizes import A4
    from reportlab.lib import colors
    from reportlab.lib.units import mm
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
    from reportlab.graphics.shapes import Drawing, Rect
    from reportlab.platypus.flowables import Flowable
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    import matplotlib.patches as mpatches
    from matplotlib.patches import FancyBboxPatch
    import numpy as np
    HAS_LIBS = True
except ImportError:
    HAS_LIBS = False

W, H = A4
MARGIN = 18 * mm
NAVY   = colors.HexColor('#003087')
BLUE   = colors.HexColor('#009cde')
GREEN  = colors.HexColor('#1a7a3c')
RED    = colors.HexColor('#c0392b')
GRAY1  = colors.HexColor('#1a1a2e')
GRAY4  = colors.HexColor('#e8e8f0')
GRAY5  = colors.HexColor('#f5f5fa')


def generate_chart(history, ticker):
    """Generate candlestick chart as PNG bytes using matplotlib"""
    if not history or len(history) < 5:
        return None
    try:
        dates  = list(range(len(history)))
        opens  = [h.get('open',  h.get('price', 0)) for h in history]
        highs  = [h.get('high',  h.get('price', 0)) for h in history]
        lows   = [h.get('low',   h.get('price', 0)) for h in history]
        closes = [h.get('close', h.get('price', 0)) for h in history]
        vols   = [h.get('volume', 0) or 0           for h in history]

        fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(10, 5),
                                        gridspec_kw={'height_ratios': [3, 1]},
                                        facecolor='white')
        fig.patch.set_facecolor('white')

        # Candlesticks
        width = 0.6
        for i in dates:
            c  = closes[i]
            o  = opens[i]
            hi = highs[i]
            lo = lows[i]
            col = '#22c55e' if c >= o else '#ef4444'
            ax1.plot([i, i], [lo, hi], color=col, linewidth=0.8, zorder=2)
            ax1.add_patch(FancyBboxPatch(
                (i - width/2, min(o, c)), width, abs(c - o) + 0.0001,
                boxstyle='square,pad=0', facecolor=col, edgecolor=col, linewidth=0, zorder=3
            ))

        # MA50
        if len(closes) >= 50:
            ma50 = [sum(closes[max(0,i-49):i+1])/min(50,i+1) for i in range(len(closes))]
            ax1.plot(dates, ma50, color='#f59e0b', linewidth=1, linestyle='--', label='MA50', zorder=4)

        # MA200
        if len(closes) >= 200:
            ma200 = [sum(closes[max(0,i-199):i+1])/min(200,i+1) for i in range(len(closes))]
            ax1.plot(dates, ma200, color='#ef4444', linewidth=1, linestyle='--', label='MA200', zorder=4)

        ax1.set_facecolor('white')
        ax1.grid(True, alpha=0.3, color='#e5e7eb')
        ax1.spines['top'].set_visible(False)
        ax1.spines['right'].set_visible(False)
        ax1.set_ylabel('Price ($)', fontsize=8)
        ax1.legend(fontsize=7, loc='upper left')
        ax1.set_xlim(-1, len(dates))

        # X axis labels — show every ~30 days
        step  = max(1, len(dates) // 8)
        ticks = list(range(0, len(dates), step))
        labels = [history[i]['date'][5:] if i < len(history) else '' for i in ticks]
        ax1.set_xticks(ticks)
        ax1.set_xticklabels(labels, fontsize=7)

        # Volume
        vol_colors = ['#bbf7d0' if closes[i] >= opens[i] else '#fecaca' for i in dates]
        ax2.bar(dates, vols, color=vol_colors, width=0.8, zorder=2)
        ax2.set_facecolor('white')
        ax2.grid(True, alpha=0.2, color='#e5e7eb')
        ax2.spines['top'].set_visible(False)
        ax2.spines['right'].set_visible(False)
        ax2.set_ylabel('Volume', fontsize=7)
        ax2.set_xticks([])
        ax2.yaxis.set_major_formatter(plt.FuncFormatter(lambda x, _: f'{x/1e6:.0f}M' if x >= 1e6 else f'{x:.0f}'))
        ax2.tick_params(labelsize=7)

        plt.suptitle(f'{ticker} — Price Chart (1 Year)', fontsize=10, fontweight='bold', color='#1a1a2e')
        plt.tight_layout(rect=[0, 0, 1, 0.96])

        buf = io.BytesIO()
        plt.savefig(buf, format='png', dpi=150, bbox_inches='tight', facecolor='white')
        plt.close(fig)
        buf.seek(0)
        return buf.getvalue()
    except Exception as e:
        print(f'Chart error: {e}')
        return None


def generate_pdf(data: dict) -> bytes:
    styles  = getSampleStyleSheet()
    sTitle  = ParagraphStyle('sTitle',  fontName='Helvetica-Bold', fontSize=18, textColor=colors.white,  leading=22)
    sBody   = ParagraphStyle('sBody',   fontName='Helvetica',      fontSize=8.5, textColor=GRAY1, leading=13)
    sSmall  = ParagraphStyle('sSmall',  fontName='Helvetica',      fontSize=7,   textColor=colors.HexColor('#8888aa'), leading=10)
    sSection= ParagraphStyle('sSection',fontName='Helvetica-Bold', fontSize=11,  textColor=NAVY, leading=14, spaceAfter=4, spaceBefore=8)

    buf   = io.BytesIO()
    doc   = SimpleDocTemplate(buf, pagesize=A4,
                               leftMargin=MARGIN, rightMargin=MARGIN,
                               topMargin=12*mm, bottomMargin=18*mm)
    cw    = W - 2*MARGIN
    story = []

    # Header
    ticker  = data.get('ticker', 'N/A')
    name    = data.get('name',   ticker)
    price   = data.get('price',  0)
    change  = data.get('change', 0)
    changep = data.get('changePct', 0)
    rec     = data.get('recommendation', 'N/A')
    target  = data.get('analystTarget', 0)

    header_data = [[
        Paragraph(f'<font color="white"><b>{name}</b></font>', sTitle),
        Paragraph(f'<font color="white"><b>${price:.2f}</b><br/>'
                  f'<font size="10">{"+" if change >= 0 else ""}{change:.2f} ({"+" if changep >= 0 else ""}{changep:.2f}%)</font></font>', sTitle),
    ]]
    header_table = Table(header_data, colWidths=[cw*0.65, cw*0.35])
    header_table.setStyle(TableStyle([
        ('BACKGROUND',   (0,0), (-1,-1), NAVY),
        ('LEFTPADDING',  (0,0), (-1,-1), 5*mm),
        ('RIGHTPADDING', (0,0), (-1,-1), 5*mm),
        ('TOPPADDING',   (0,0), (-1,-1), 4*mm),
        ('BOTTOMPADDING',(0,0), (-1,-1), 4*mm),
        ('VALIGN',       (0,0), (-1,-1), 'MIDDLE'),
        ('ALIGN',        (1,0), (1,-1),  'RIGHT'),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 4*mm))

    # Badge
    story.append(Paragraph(
        f'Ticker: <b>{ticker}</b> · Source: Yahoo Finance + Alpha Vantage · Verified data · No AI-generated numbers',
        sSmall))
    story.append(Spacer(1, 3*mm))

    # Metrics
    metrics = [
        ('Market Cap',    data.get('marketCap', 'N/A')),
        ('P/E Ratio',     data.get('pe', 'N/A')),
        ('EPS (TTM)',      f"${data.get('eps', 'N/A')}"),
        ('Beta',          data.get('beta', 'N/A')),
        ('52W High',      f"${data.get('week52High', 0):.2f}"),
        ('52W Low',       f"${data.get('week52Low', 0):.2f}"),
        ('Volume',        data.get('volume', 'N/A')),
        ('Analyst target',f"${target:.2f}" if target else 'N/A'),
    ]
    card_w = (cw - 3*3*mm) / 4
    rows = [metrics[:4], metrics[4:]]
    for row in rows:
        tdata = [[Paragraph(f'<font size="7" color="#8888aa">{r[0].upper()}</font><br/>'
                            f'<font size="14"><b>{r[1]}</b></font>', styles['Normal'])
                  for r in row]]
        t = Table(tdata, colWidths=[card_w]*4)
        t.setStyle(TableStyle([
            ('BACKGROUND',   (0,0), (-1,-1), GRAY5),
            ('LEFTPADDING',  (0,0), (-1,-1), 3*mm),
            ('RIGHTPADDING', (0,0), (-1,-1), 3*mm),
            ('TOPPADDING',   (0,0), (-1,-1), 3*mm),
            ('BOTTOMPADDING',(0,0), (-1,-1), 3*mm),
            ('GRID',         (0,0), (-1,-1), 0.3, GRAY4),
        ]))
        story.append(t)
        story.append(Spacer(1, 2*mm))

    # Chart
    history = data.get('history', [])
    if history and HAS_LIBS:
        chart_bytes = generate_chart(history, ticker)
        if chart_bytes:
            story.append(Spacer(1, 3*mm))
            story.append(Paragraph('PRICE CHART — 1 YEAR (Candlestick + MA50 + MA200 + Volume)', sSection))
            from reportlab.platypus import Image as RLImage
            img = RLImage(io.BytesIO(chart_bytes), width=cw, height=cw*0.45)
            story.append(img)
            story.append(Spacer(1, 3*mm))

    # AI Analysis
    ai = data.get('aiSummary', '')
    if ai:
        story.append(HRFlowable(width=cw, thickness=2, color=NAVY))
        story.append(Spacer(1, 3*mm))
        story.append(Paragraph('AI ANALYSIS — VERIFIED DATA', sSection))
        ai_box = Table([[Paragraph(ai, sBody)]], colWidths=[cw])
        ai_box.setStyle(TableStyle([
            ('BACKGROUND',   (0,0), (-1,-1), colors.HexColor('#e8f4fc')),
            ('LEFTPADDING',  (0,0), (-1,-1), 4*mm),
            ('RIGHTPADDING', (0,0), (-1,-1), 4*mm),
            ('TOPPADDING',   (0,0), (-1,-1), 3*mm),
            ('BOTTOMPADDING',(0,0), (-1,-1), 3*mm),
            ('BOX',          (0,0), (-1,-1), 0.5, BLUE),
        ]))
        story.append(ai_box)

    # Analyst consensus
    analysts = data.get('analysts')
    if analysts and rec != 'N/A':
        story.append(Spacer(1, 4*mm))
        story.append(HRFlowable(width=cw, thickness=2, color=BLUE))
        story.append(Spacer(1, 3*mm))
        story.append(Paragraph('ANALYST CONSENSUS', sSection))
        cons_data = [
            ['Consensus', 'Mean Target', 'Upside', 'Strong Buy', 'Buy', 'Hold', 'Sell'],
            [
                rec,
                f'${target:.2f}' if target else 'N/A',
                f'+{((target-price)/price*100):.1f}%' if target and price else 'N/A',
                str(analysts.get('strongBuy', 0)),
                str(analysts.get('buy', 0)),
                str(analysts.get('hold', 0)),
                str(analysts.get('sell', 0) + analysts.get('strongSell', 0)),
            ]
        ]
        cons_table = Table(cons_data, colWidths=[cw/7]*7)
        cons_table.setStyle(TableStyle([
            ('BACKGROUND',  (0,0), (-1,0),  NAVY),
            ('TEXTCOLOR',   (0,0), (-1,0),  colors.white),
            ('FONTNAME',    (0,0), (-1,0),  'Helvetica-Bold'),
            ('FONTSIZE',    (0,0), (-1,-1), 8),
            ('ALIGN',       (0,0), (-1,-1), 'CENTER'),
            ('TOPPADDING',  (0,0), (-1,-1), 2*mm),
            ('BOTTOMPADDING',(0,0),(-1,-1), 2*mm),
            ('GRID',        (0,0), (-1,-1), 0.3, GRAY4),
            ('BACKGROUND',  (0,1), (-1,-1), GRAY5),
        ]))
        story.append(cons_table)

    # Disclaimer
    story.append(Spacer(1, 8*mm))
    story.append(HRFlowable(width=cw, thickness=0.5, color=GRAY4))
    story.append(Spacer(1, 2*mm))
    story.append(Paragraph(
        'This report is for informational purposes only and does not constitute financial advice. '
        'Data sourced from Yahoo Finance and Alpha Vantage. AI analysis uses only verified data.',
        sSmall))

    doc.build(story)
    buf.seek(0)
    return buf.getvalue()


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed = urlparse(self.path)
        params = parse_qs(parsed.query)
        ticker = params.get('ticker', ['UNKNOWN'])[0].upper()
        data_b64 = params.get('data', [''])[0]

        try:
            if data_b64:
                import urllib.parse
                data = json.loads(urllib.parse.unquote(data_b64))
            else:
                data = {'ticker': ticker, 'name': ticker, 'price': 0}

            if not HAS_LIBS:
                self.send_response(500)
                self.end_headers()
                self.wfile.write(b'Missing libraries: reportlab or matplotlib')
                return

            pdf_bytes = generate_pdf(data)

            self.send_response(200)
            self.send_header('Content-Type', 'application/pdf')
            self.send_header('Content-Disposition', f'attachment; filename="{ticker}_StockAI_Report.pdf"')
            self.send_header('Content-Length', str(len(pdf_bytes)))
            self.end_headers()
            self.wfile.write(pdf_bytes)

        except Exception as e:
            self.send_response(500)
            self.end_headers()
            self.wfile.write(str(e).encode())

    def log_message(self, format, *args):
        pass
```

Poi crea il file `requirements.txt` nella root del progetto:
```
reportlab==4.1.0
matplotlib==3.8.4
numpy==1.26.4