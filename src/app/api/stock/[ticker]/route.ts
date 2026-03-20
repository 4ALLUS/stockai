import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get('q') ?? '').trim()
  if (q.length < 2) return NextResponse.json({ suggestions: [] })

  try {
    const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=8&newsCount=0&enableFuzzyQuery=false&quotesQueryId=tss_match_phrase_query`
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      }
    })
    const data = await res.json()
    const quotes = data?.finance?.result?.[0]?.quotes ?? []
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