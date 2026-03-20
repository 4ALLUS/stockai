import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get('q') ?? '').trim()
  if (q.length < 2) return NextResponse.json({ suggestions: [] })

  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/search?q=${encodeURIComponent(q)}&token=d6usl79r01qig545o780d6usl79r01qig545o78g`
    )
    const data = await res.json()
    const suggestions = (data?.result ?? [])
      .filter((r: any) => r.symbol && r.description)
      .slice(0, 8)
      .map((r: any) => ({
        symbol:   r.symbol,
        name:     r.description,
        exchDisp: r.primaryExchange ?? '',
        typeDisp: r.type ?? 'Equity',
      }))
    return NextResponse.json({ suggestions })
  } catch (err) {
    console.error('[search]', err)
    return NextResponse.json({ suggestions: [] })
  }
}