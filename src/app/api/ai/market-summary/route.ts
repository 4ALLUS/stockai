import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY
    if (!ANTHROPIC_KEY) return NextResponse.json({ summary: 'API key missing.' })

    const tickers = ['AAPL', 'NVDA', 'MSFT', 'TSLA']
    const prices = await Promise.all(
      tickers.map(t =>
        fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${t}?interval=1d&range=1d`, {
          headers: { 'User-Agent': 'Mozilla/5.0' }
        })
        .then(r => r.json())
        .then(d => ({
          ticker: t,
          price:  d?.chart?.result?.[0]?.meta?.regularMarketPrice?.toFixed(2) ?? 'N/A',
          change: ((d?.chart?.result?.[0]?.meta?.regularMarketPrice - d?.chart?.result?.[0]?.meta?.chartPreviousClose) / d?.chart?.result?.[0]?.meta?.chartPreviousClose * 100).toFixed(2) ?? 'N/A',
        }))
        .catch(() => ({ ticker: t, price: 'N/A', change: 'N/A' }))
      )
    )

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 150,
        system: 'You are a financial market analyst. Write a brief 2-sentence market summary in English using ONLY the verified data provided. Never invent numbers.',
        messages: [{
          role: 'user',
          content: `Today market data (verified):\n${JSON.stringify(prices)}\n\nWrite a 2-sentence summary.`
        }]
      })
    })

    const data = await res.json()
    const summary = data?.content?.[0]?.text ?? 'Market data unavailable.'
    return NextResponse.json({ summary })

  } catch (err: any) {
    console.error('[market-summary]', err)
    return NextResponse.json({ summary: 'Unable to generate market summary at this time.' })
  }
}