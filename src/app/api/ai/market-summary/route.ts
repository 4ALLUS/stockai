import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY
    const AV_KEY = process.env.ALPHA_VANTAGE_KEY

    if (!ANTHROPIC_KEY) return NextResponse.json({ summary: 'API key missing.' })

    // Usa Alpha Vantage che funziona su Vercel
    const tickers = ['AAPL', 'MSFT', 'NVDA']
    const quotes = await Promise.all(
      tickers.map(t =>
        fetch(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${t}&apikey=${AV_KEY}`)
          .then(r => r.json())
          .then(d => ({
            ticker: t,
            price:  d?.['Global Quote']?.['05. price'] ?? 'N/A',
            change: d?.['Global Quote']?.['10. change percent'] ?? 'N/A',
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
          content: `Today market data:\n${JSON.stringify(quotes)}\n\nWrite a 2-sentence summary.`
        }]
      })
    })

    const data = await res.json()
    const summary = data?.content?.[0]?.text ?? 'Market data unavailable.'
    return NextResponse.json({ summary })

  } catch (err: any) {
    console.error('[market-summary]', err)
    return NextResponse.json({ summary: 'Market data unavailable.' })
  }
}