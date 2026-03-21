import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: { ticker: string } }
) {
  const ticker = params.ticker.toUpperCase()
  const FINNHUB = 'd6usl79r01qig545o780d6usl79r01qig545o78g'

  try {
    const [yahooRes, metricRes, targetRes] = await Promise.all([
      fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
      }),
      fetch(`https://finnhub.io/api/v1/stock/metric?symbol=${ticker}&metric=all&token=${FINNHUB}`),
      fetch(`https://finnhub.io/api/v1/stock/price-target?symbol=${ticker}&token=${FINNHUB}`),
    ])

    const yahooData = await yahooRes.json()
    const metric    = await metricRes.json()
    const target    = await targetRes.json()

    const meta = yahooData?.chart?.result?.[0]?.meta
    if (!meta) return NextResponse.json(
      { error: `Ticker "${ticker}" not found` }, { status: 404 }
    )

    const price         = meta.regularMarketPrice ?? 0
    const prev          = meta.chartPreviousClose ?? meta.previousClose ?? price
    const change        = price - prev
    const changePct     = prev > 0 ? (change / prev) * 100 : 0
    const m             = metric?.metric ?? {}
    const analystTarget = target?.targetMean ?? 0
    const volume        = meta.regularMarketVolume ?? 0
    const rec           = analystTarget > 0
      ? price < analystTarget * 0.95 ? 'Buy' : price > analystTarget * 1.05 ? 'Sell' : 'Hold'
      : 'N/A'

    let aiSummary = `${meta.shortName ?? ticker} is trading at $${price.toFixed(2)}${analystTarget > 0 ? `, analyst mean target: $${analystTarget.toFixed(2)}` : ''}.`

    try {
      const Anthropic = (await import('@anthropic-ai/sdk')).default
      const client = new Anthropic()
      const res = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 300,
        system: 'You are a financial analyst. Write a 3-sentence stock analysis in English using ONLY the data provided. Never invent numbers.',
        messages: [{
          role: 'user',
          content: `Analyze ${ticker}: Price $${price.toFixed(2)}, Change ${changePct.toFixed(2)}%, P/E ${m['peNormalizedAnnual'] ?? 'N/A'}, Beta ${m['beta'] ?? 'N/A'}, 52W High $${m['52WeekHigh'] ?? meta.fiftyTwoWeekHigh ?? 'N/A'}, 52W Low $${m['52WeekLow'] ?? meta.fiftyTwoWeekLow ?? 'N/A'}, Analyst target $${analystTarget > 0 ? analystTarget.toFixed(2) : 'N/A'}, Market Cap $${m['marketCapitalization'] ? (m['marketCapitalization']/1000).toFixed(1)+'B' : 'N/A'}.`
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
      marketCap:      m['marketCapitalization'] ? '$'+(m['marketCapitalization']/1000).toFixed(1)+'B' : 'N/A',
      pe:             m['peNormalizedAnnual'] ? m['peNormalizedAnnual'].toFixed(1)+'x' : 'N/A',
      eps:            m['epsNormalizedAnnual'] ? m['epsNormalizedAnnual'].toFixed(2) : 'N/A',
      beta:           m['beta'] ? m['beta'].toFixed(2) : 'N/A',
      week52High:     m['52WeekHigh'] ?? meta.fiftyTwoWeekHigh ?? 0,
      week52Low:      m['52WeekLow']  ?? meta.fiftyTwoWeekLow  ?? 0,
      volume:         volume ? (volume/1e6).toFixed(1)+'M' : 'N/A',
      analystTarget,
      recommendation: rec,
      aiSummary,
    })

  } catch (err) {
    console.error('[stock API]', err)
    return NextResponse.json({ error: `Ticker "${ticker}" not found` }, { status: 404 })
  }
}