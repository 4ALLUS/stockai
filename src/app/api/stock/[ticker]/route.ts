import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: { ticker: string } }
) {
  const ticker = params.ticker.toUpperCase()

  try {
    const [quoteRes, summaryRes] = await Promise.all([
      fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=5d`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
      }),
      fetch(`https://query1.finance.yahoo.com/v10/finance/quoteSummary/${ticker}?modules=financialData,defaultKeyStatistics,summaryDetail,recommendationTrend`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
      })
    ])

    const quoteData   = await quoteRes.json()
    const summaryData = await summaryRes.json()

    const meta    = quoteData?.chart?.result?.[0]?.meta
    const sd      = summaryData?.quoteSummary?.result?.[0]
    const fin     = sd?.financialData
    const stat    = sd?.defaultKeyStatistics
    const summary = sd?.summaryDetail

    if (!meta) return NextResponse.json({ error: `Ticker "${ticker}" not found` }, { status: 404 })

    const price         = meta.regularMarketPrice ?? 0
    const prev          = meta.chartPreviousClose ?? meta.previousClose ?? price
    const change        = price - prev
    const changePct     = prev > 0 ? (change / prev) * 100 : 0
    const analystTarget = fin?.targetMeanPrice?.raw ?? 0
    const rec           = fin?.recommendationKey ?? 'hold'

    let aiSummary = `${meta.shortName ?? ticker} is trading at $${price.toFixed(2)}, analyst consensus: ${rec}, mean target: $${analystTarget.toFixed(2)}.`

    try {
      const Anthropic = (await import('@anthropic-ai/sdk')).default
      const client = new Anthropic()
      const res = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 300,
        system: 'You are a financial analyst. Write a 3-sentence stock analysis in English using ONLY the data provided. Never invent numbers.',
        messages: [{
          role: 'user',
          content: `Analyze ${ticker}: Price $${price.toFixed(2)}, Change ${changePct.toFixed(2)}%, P/E ${summary?.trailingPE?.raw?.toFixed(1) ?? 'N/A'}, Target $${analystTarget.toFixed(2)}, Recommendation: ${rec}, 52W High $${meta.fiftyTwoWeekHigh ?? 'N/A'}, 52W Low $${meta.fiftyTwoWeekLow ?? 'N/A'}.`
        }]
      })
      if (res.content[0].type === 'text') aiSummary = res.content[0].text
    } catch (e) {
      console.error('AI error:', e)
    }

    return NextResponse.json({
      ticker,
      name:           meta.shortName ?? meta.longName ?? ticker,
      price,
      change:         parseFloat(change.toFixed(2)),
      changePct:      parseFloat(changePct.toFixed(2)),
      marketCap:      summary?.marketCap?.raw ? '$'+(summary.marketCap.raw/1e9).toFixed(1)+'B' : 'N/A',
      pe:             summary?.trailingPE?.raw ? summary.trailingPE.raw.toFixed(1)+'x' : 'N/A',
      eps:            stat?.trailingEps?.raw?.toFixed(2) ?? 'N/A',
      beta:           summary?.beta?.raw?.toFixed(2) ?? 'N/A',
      week52High:     meta.fiftyTwoWeekHigh ?? 0,
      week52Low:      meta.fiftyTwoWeekLow ?? 0,
      volume:         meta.regularMarketVolume ? (meta.regularMarketVolume/1e6).toFixed(1)+'M' : 'N/A',
      analystTarget,
      recommendation: rec.charAt(0).toUpperCase() + rec.slice(1),
      aiSummary,
    })

  } catch (err) {
    console.error('[stock API]', err)
    return NextResponse.json({ error: `Ticker "${ticker}" not found` }, { status: 404 })
  }
}