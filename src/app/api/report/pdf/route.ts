import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const ticker = req.nextUrl.searchParams.get('ticker') ?? 'UNKNOWN'

  // Fetch stock data from our own API
  const base    = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const dataRes = await fetch(`${base}/api/stock/${ticker}`)
  const data    = await dataRes.json()

  // In production: generate PDF with reportlab via a Python microservice
  // or use a Node PDF library like pdfkit / puppeteer.
  // For now we return a placeholder response so the download flow is wired up.
  const placeholder = `StockAI Report — ${ticker}\n\nPrice: $${data.price}\nAI Summary: ${data.aiSummary}\n\n[Full PDF generation requires the Python reportlab service — see /scripts/generate_report.py]`
  const buffer = Buffer.from(placeholder, 'utf-8')

  return new NextResponse(buffer, {
    headers: {
      'Content-Type':        'application/pdf',
      'Content-Disposition': `attachment; filename="${ticker}_StockAI_Report.pdf"`,
    },
  })
}
