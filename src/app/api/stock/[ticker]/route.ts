import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get('q') ?? '').trim()
  
  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/search?q=tesla&token=d6usl79r01qig545o780d6usl79r01qig545o78g`
    )
    const text = await res.text()
    return NextResponse.json({ status: res.status, body: text.slice(0, 300) })
  } catch (err: any) {
    return NextResponse.json({ error: err.message })
  }
}
