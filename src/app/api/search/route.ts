import { NextRequest, NextResponse } from 'next/server'
import yahooFinance from 'yahoo-finance2'

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get('q') ?? '').trim()
  if (q.length < 2) return NextResponse.json({ suggestions: [] })

  try {
    const results: any = await yahooFinance.search(q, { newsCount: 0 } as any)
    const quotes = results?.quotes ?? results?.results ?? []
    const suggestions = quotes
      .filter((r: any) => r.symbol && (r.shortname || r.longname) && r.quoteType !== 'OPTION')
      .slice(0, 8)
      .map((r: any) => ({
        symbol:   r.symbol,
        name:     r.shortname ?? r.longname ?? r.symbol,
        exchDisp: r.exchDisp ?? r.exchange ?? '',
        typeDisp: r.typeDisp ?? r.quoteType ?? '',
      }))
    return NextResponse.json({ suggestions })
  } catch (err) {
    console.error('[search]', err)
    return NextResponse.json({ suggestions: [] })
  }
}