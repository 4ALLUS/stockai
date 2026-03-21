import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const data      = await req.json()
    const ticker    = data.ticker ?? 'UNKNOWN'
    const pdfUrl    = process.env.PDF_SERVICE_URL ?? 'https://web-production-13a1c.up.railway.app'

    const res = await fetch(`${pdfUrl}/pdf`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(data),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('[PDF]', err)
      return NextResponse.json({ error: 'PDF service error' }, { status: 500 })
    }

    const pdfBytes = await res.arrayBuffer()

    return new NextResponse(pdfBytes, {
      headers: {
        'Content-Type':        'application/pdf',
        'Content-Disposition': `attachment; filename="${ticker}_StockAI_Report.pdf"`,
      },
    })
  } catch (err: any) {
    console.error('[PDF route]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}