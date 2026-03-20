import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get('q') ?? '').trim()
  if (q.length < 2) return NextResponse.json({ suggestions: [] })

  try {
    const key = process.env.ALPHA_VANTAGE_KEY
    const url = `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${encodeURIComponent(q)}&apikey=${key}`
    const res  = await fetch(url)
    const data = await res.json()
    console.log('Alpha key:', process.env.ALPHA_VANTAGE_KEY ? 'present' : 'MISSING')
    console.log('Data:', JSON.stringify(data).slice(0, 200))
    const suggestions = (data?.bestMatches ?? [])
      .slice(0, 8)
      .map((r: any) => ({
        symbol:   r['1. symbol'],
        name:     r['2. name'],
        exchDisp: r['4. region'],
        typeDisp: r['3. type'],
      }))
    return NextResponse.json({ suggestions })
  } catch (err) {
    console.error('[search]', err)
    return NextResponse.json({ suggestions: [] })
  }
}