import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get('q') ?? '').trim()
  if (q.length < 2) return NextResponse.json({ suggestions: [], debug: 'too short' })

  const key = process.env.ALPHA_VANTAGE_KEY
  if (!key) return NextResponse.json({ suggestions: [], debug: 'NO API KEY' })

  const url = `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${encodeURIComponent(q)}&apikey=${key}`
  
  try {
    const res  = await fetch(url)
    const text = await res.text()
    const data = JSON.parse(text)
    const suggestions = (data?.bestMatches ?? [])
      .slice(0, 8)
      .map((r: any) => ({
        symbol:   r['1. symbol'],
        name:     r['2. name'],
        exchDisp: r['4. region'],
        typeDisp: r['3. type'],
      }))
    return NextResponse.json({ suggestions, debug: `found ${suggestions.length}`, raw: text.slice(0, 100) })
  } catch (err: any) {
    return NextResponse.json({ suggestions: [], debug: 'ERROR: ' + err.message })
  }
}