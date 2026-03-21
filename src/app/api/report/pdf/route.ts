import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const data   = await req.json()
    const ticker = data.ticker ?? 'UNKNOWN'

    const pythonUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/report/pdf.py`

    const res = await fetch(pythonUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!res.ok) throw new Error('Python service error')

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