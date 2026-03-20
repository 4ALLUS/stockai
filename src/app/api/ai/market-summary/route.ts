import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

export async function GET() {
  try {
    const tickers = ['SPY', 'QQQ', 'NVDA', 'AAPL']
    const prices  = await Promise.all(
      tickers.map(t =>
        fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${t}?interval=1d&range=1d`)
          .then(r => r.json())
          .then(d => ({
            ticker:  t,
            price:   d.chart.result[0].meta.regularMarketPrice,
            change:  ((d.chart.result[0].meta.regularMarketPrice - d.chart.result[0].meta.chartPreviousClose) /
                       d.chart.result[0].meta.chartPreviousClose * 100).toFixed(2),
          }))
          .catch(() => null)
      )
    )

    const verifiedData = prices.filter(Boolean)

    const res = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 150,
      system: 'You are a financial market analyst. Write a brief 2-sentence market summary in English using ONLY the verified data provided. Never invent numbers.',
      messages: [{
        role: 'user',
        content: `Today market data (verified from Yahoo Finance):\n${JSON.stringify(verifiedData)}\n\nWrite a 2-sentence summary.`
      }]
    })

    const summary = res.content[0].type === 'text'
      ? res.content[0].text
      : 'Market data unavailable.'

    return NextResponse.json({ summary })
  } catch {
    return NextResponse.json({ summary: 'Unable to generate market summary at this time.' })
  }
}
