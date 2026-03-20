import { NextRequest, NextResponse } from 'next/server'
import yahooFinance from 'yahoo-finance2'

export async function GET(
  _req: NextRequest,
  { params }: { params: { ticker: string } }
) {
  const ticker = params.ticker.toUpperCase()

  try {
const quote: any = await (yahooFinance as any).quote(ticker)
let summary: any = null
try {
  summary = await (yahooFinance as any).quoteSummary(ticker, {
    modules: ['financialData', 'defaultKeyStatistics', 'summaryDetail', 'recommendationTrend']
  })
} catch {}

    const fin  = summary?.financialData
    const stat = summary?.defaultKeyStatistics
    const sd   = summary?.summaryDetail

    const price         = quote.regularMarketPrice ?? 0
    const change        = quote.regularMarketChange ?? 0
    const changePct     = quote.regularMarketChangePercent ?? 0
    const analystTarget = fin?.targetMeanPrice ?? 0
    const rec           = fin?.recommendationKey ?? 'hold'

    let aiSummary = `${quote.shortName ?? ticker} is trading at $${price.toFixed(2)}, analyst consensus: ${rec}, mean target: $${analystTarget.toFixed(2)}.`

    try {
      const Anthropic = (await import('@anthropic-ai/sdk')).default
      const client = new Anthropic()
      const res = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 300,
        system: 'You are a financial analyst. Write a 3-sentence stock analysis in English using ONLY the data provided. Never invent numbers.',
        messages: [{
          role: 'user',
          content: `Analyze ${ticker}: Price $${price.toFixed(2)}, Change ${changePct.toFixed(2)}%, P/E ${sd?.trailingPE?.toFixed(1) ?? 'N/A'}, Target $${analystTarget.toFixed(2)}, Recommendation: ${rec}, 52W High $${quote.fiftyTwoWeekHigh ?? 'N/A'}, 52W Low $${quote.fiftyTwoWeekLow ?? 'N/A'}, Market Cap ${quote.marketCap ? '$'+(quote.marketCap/1e9).toFixed(1)+'B' : 'N/A'}.`
        }]
      })
      if (res.content[0].type === 'text') aiSummary = res.content[0].text
    } catch (e) {
      console.error('AI error:', e)
    }

    return NextResponse.json({
      ticker,
      name:           quote.shortName ?? quote.longName ?? ticker,
      price,
      change:         parseFloat(change.toFixed(2)),
      changePct:      parseFloat(changePct.toFixed(2)),
      marketCap:      quote.marketCap ? '$'+(quote.marketCap/1e9).toFixed(1)+'B' : 'N/A',
      pe:             sd?.trailingPE ? sd.trailingPE.toFixed(1)+'x' : 'N/A',
      eps:            stat?.trailingEps?.toFixed(2) ?? 'N/A',
      beta:           sd?.beta?.toFixed(2) ?? 'N/A',
      week52High:     quote.fiftyTwoWeekHigh ?? 0,
      week52Low:      quote.fiftyTwoWeekLow ?? 0,
      volume:         quote.regularMarketVolume ? (quote.regularMarketVolume/1e6).toFixed(1)+'M' : 'N/A',
      analystTarget,
      recommendation: rec.charAt(0).toUpperCase() + rec.slice(1),
      aiSummary,
    })

  } catch (err) {
    console.error('[stock API]', err)
    return NextResponse.json(
      { error: `Ticker "${ticker}" not found or data unavailable` },
      { status: 404 }
    )
  }
}