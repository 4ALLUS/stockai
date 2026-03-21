import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: { ticker: string } }
) {
  const ticker = params.ticker.toUpperCase()
  const AV_KEY = process.env.ALPHA_VANTAGE_KEY ?? 'TUA_CHIAVE_ALPHA_VANTAGE'

  try {
    const [yahooRes, overviewRes] = await Promise.all([
      fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
      }),
      fetch(`https://www.alphavantage.co/query?function=OVERVIEW&symbol=${ticker}&apikey=${AV_KEY}`),
    ])

    const yahooData = await yahooRes.json()
    const overview  = await overviewRes.json()

    const meta = yahooData?.chart?.result?.[0]?.meta
    if (!meta) return NextResponse.json(
      { error: `Ticker "${ticker}" not found` }, { status: 404 }
    )

    const price         = meta.regularMarketPrice ?? 0
    const prev          = meta.chartPreviousClose ?? meta.previousClose ?? price
    const change        = price - prev
    const changePct     = prev > 0 ? (change / prev) * 100 : 0
    const volume        = meta.regularMarketVolume ?? 0
    const analystTarget = parseFloat(overview?.AnalystTargetPrice ?? '0') || 0
    const strongBuy     = parseInt(overview?.AnalystRatingStrongBuy ?? '0')
    const buy           = parseInt(overview?.AnalystRatingBuy ?? '0')
    const hold          = parseInt(overview?.AnalystRatingHold ?? '0')
    const sell          = parseInt(overview?.AnalystRatingSell ?? '0')
    const strongSell    = parseInt(overview?.AnalystRatingStrongSell ?? '0')
    const totalAnalysts = strongBuy + buy + hold + sell + strongSell
    const bullPct       = totalAnalysts > 0 ? Math.round((strongBuy + buy) / totalAnalysts * 100) : 0
    const rec           = bullPct >= 60 ? 'Buy' : bullPct >= 40 ? 'Hold' : 'Sell'

    let aiSummary = `${overview?.Name ?? meta.shortName ?? ticker} is trading at $${price.toFixed(2)}${analystTarget > 0 ? `, analyst mean target: $${analystTarget.toFixed(2)}, consensus: ${rec}` : ''}.`

    try {
      const Anthropic = (await import('@anthropic-ai/sdk')).default
      const client = new Anthropic()
      const res = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 300,
        system: 'You are a financial analyst. Write a 3-sentence stock analysis in English using ONLY the data provided. Never invent numbers.',
        messages: [{
          role: 'user',
          content: `Analyze ${ticker} (${overview?.Name ?? ticker}): Price $${price.toFixed(2)}, Change ${changePct.toFixed(2)}%, P/E ${overview?.PERatio ?? 'N/A'}, EPS $${overview?.EPS ?? 'N/A'}, Beta ${overview?.Beta ?? 'N/A'}, 52W High $${overview?.['52WeekHigh'] ?? 'N/A'}, 52W Low $${overview?.['52WeekLow'] ?? 'N/A'}, Analyst target $${analystTarget > 0 ? analystTarget.toFixed(2) : 'N/A'}, Recommendation: ${rec}, Sector: ${overview?.Sector ?? 'N/A'}, Market Cap $${overview?.MarketCapitalization ? (parseInt(overview.MarketCapitalization)/1e9).toFixed(1)+'B' : 'N/A'}.`
        }]
      })
      if (res.content[0].type === 'text') aiSummary = res.content[0].text
    } catch (e) {
      console.error('AI error:', e)
    }

    return NextResponse.json({
      ticker,
      name:           overview?.Name ?? meta.shortName ?? meta.longName ?? ticker,
      price,
      change:         parseFloat(change.toFixed(2)),
      changePct:      parseFloat(changePct.toFixed(2)),
      marketCap:      overview?.MarketCapitalization ? '$'+(parseInt(overview.MarketCapitalization)/1e9).toFixed(1)+'B' : 'N/A',
      pe:             overview?.PERatio ? parseFloat(overview.PERatio).toFixed(1)+'x' : 'N/A',
      eps:            overview?.EPS ?? 'N/A',
      beta:           overview?.Beta ? parseFloat(overview.Beta).toFixed(2) : 'N/A',
      week52High:     parseFloat(overview?.['52WeekHigh'] ?? '0') || meta.fiftyTwoWeekHigh || 0,
      week52Low:      parseFloat(overview?.['52WeekLow'] ?? '0')  || meta.fiftyTwoWeekLow  || 0,
      volume:         volume ? (volume/1e6).toFixed(1)+'M' : 'N/A',
      analystTarget,
      recommendation: rec,
      aiSummary,
      analysts: { strongBuy, buy, hold, sell, strongSell, bullPct },
    })

  } catch (err) {
    console.error('[stock API]', err)
    return NextResponse.json({ error: `Ticker "${ticker}" not found` }, { status: 404 })
  }
}