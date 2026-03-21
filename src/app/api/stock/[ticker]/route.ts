import { NextRequest, NextResponse } from 'next/server'

function calcMA(closes: number[], period: number): number {
  const valid = closes.filter(v => v != null && !isNaN(v))
  if (valid.length < period) return 0
  const slice = valid.slice(-period)
  return slice.reduce((a, b) => a + b, 0) / period
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { ticker: string } }
) {
  const ticker   = decodeURIComponent(params.ticker).toUpperCase()
  const AV_KEY   = process.env.ALPHA_VANTAGE_KEY ?? 'demo'
  const isCrypto = ticker.includes('-USD') || ticker.includes('-BTC')
  const isStock  = !isCrypto && !ticker.includes('=X') && !ticker.includes('=F') && !ticker.startsWith('^')

  try {
    const requests: Promise<Response>[] = [
      fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1y`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
      }),
    ]

    if (isStock) {
      requests.push(
        fetch(`https://www.alphavantage.co/query?function=OVERVIEW&symbol=${ticker}&apikey=${AV_KEY}`)
      )
    }

    if (isCrypto) {
      requests.push(fetch('https://api.alternative.me/fng/?limit=1'))
    }

    const responses = await Promise.all(requests)
    const yahooData = await responses[0].json()
    const extraData = responses[1] ? await responses[1].json() : null

    const meta   = yahooData?.chart?.result?.[0]?.meta
    const closes = yahooData?.chart?.result?.[0]?.indicators?.quote?.[0]?.close ?? []

    if (!meta) return NextResponse.json(
      { error: `Ticker "${ticker}" not found` }, { status: 404 }
    )

    const price     = meta.regularMarketPrice ?? 0
    const prev      = meta.chartPreviousClose ?? meta.previousClose ?? price
    const change    = price - prev
    const changePct = prev > 0 ? (change / prev) * 100 : 0
    const volume    = meta.regularMarketVolume ?? 0

    // Calculate MA50 and MA200 from historical closes
    const ma50  = calcMA(closes, 50)
    const ma200 = calcMA(closes, 200)
    const trend = ma50 > 0 && ma200 > 0
      ? ma50 > ma200 ? 'Golden Cross — Bullish' : 'Death Cross — Bearish'
      : null
    const trendVsMA200 = ma200 > 0
      ? price > ma200 ? 'Above MA200 — Bullish' : 'Below MA200 — Bearish'
      : null

    // Stock fundamentals
    const overview      = isStock ? extraData : null
    const analystTarget = parseFloat(overview?.AnalystTargetPrice ?? '0') || 0
    const strongBuy     = parseInt(overview?.AnalystRatingStrongBuy ?? '0')
    const buy           = parseInt(overview?.AnalystRatingBuy ?? '0')
    const hold          = parseInt(overview?.AnalystRatingHold ?? '0')
    const sell          = parseInt(overview?.AnalystRatingSell ?? '0')
    const strongSell    = parseInt(overview?.AnalystRatingStrongSell ?? '0')
    const totalAnalysts = strongBuy + buy + hold + sell + strongSell
    const bullPct       = totalAnalysts > 0 ? Math.round((strongBuy + buy) / totalAnalysts * 100) : 0
    const rec           = isStock
      ? (bullPct >= 60 ? 'Buy' : bullPct >= 40 ? 'Hold' : 'Sell')
      : 'N/A'

    // Crypto Fear & Greed
    const fng      = isCrypto ? extraData?.data?.[0] : null
    const fngValue = fng ? parseInt(fng.value) : null
    const fngLabel = fng?.value_classification ?? null

    let aiSummary = `${overview?.Name ?? meta.shortName ?? ticker} is trading at $${price.toFixed(2)}.`

    try {
      const Anthropic = (await import('@anthropic-ai/sdk')).default
      const client = new Anthropic()
      const content = isStock
        ? `Analyze ${ticker} (${overview?.Name ?? ticker}): Price $${price.toFixed(2)}, Change ${changePct.toFixed(2)}%, P/E ${overview?.PERatio ?? 'N/A'}, EPS $${overview?.EPS ?? 'N/A'}, Beta ${overview?.Beta ?? 'N/A'}, 52W High $${overview?.['52WeekHigh'] ?? 'N/A'}, 52W Low $${overview?.['52WeekLow'] ?? 'N/A'}, Analyst target $${analystTarget > 0 ? analystTarget.toFixed(2) : 'N/A'}, Recommendation: ${rec}, Sector: ${overview?.Sector ?? 'N/A'}, MA50: $${ma50.toFixed(4)}, MA200: $${ma200.toFixed(4)}, Trend: ${trend ?? 'N/A'}.`
        : `Analyze ${ticker}: Price $${price.toFixed(2)}, Change ${changePct.toFixed(2)}%, 52W High $${meta.fiftyTwoWeekHigh ?? 'N/A'}, 52W Low $${meta.fiftyTwoWeekLow ?? 'N/A'}, MA50: $${ma50.toFixed(4)}, MA200: $${ma200.toFixed(4)}, Trend: ${trend ?? trendVsMA200 ?? 'N/A'}${fngValue ? `, Fear & Greed Index: ${fngValue} (${fngLabel})` : ''}.`

      const res = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 300,
        system: 'You are a financial analyst. Write a 3-sentence analysis in English using ONLY the data provided. Never invent numbers.',
        messages: [{ role: 'user', content }]
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
      marketCap:      overview?.MarketCapitalization
        ? '$'+(parseInt(overview.MarketCapitalization)/1e9).toFixed(1)+'B'
        : meta.marketCap ? '$'+(meta.marketCap/1e9).toFixed(1)+'B' : 'N/A',
      pe:             overview?.PERatio ? parseFloat(overview.PERatio).toFixed(1)+'x' : 'N/A',
      eps:            overview?.EPS ?? 'N/A',
      beta:           overview?.Beta ? parseFloat(overview.Beta).toFixed(2) : 'N/A',
      week52High:     parseFloat(overview?.['52WeekHigh'] ?? '0') || meta.fiftyTwoWeekHigh || 0,
      week52Low:      parseFloat(overview?.['52WeekLow'] ?? '0')  || meta.fiftyTwoWeekLow  || 0,
      volume:         volume ? (volume/1e6).toFixed(1)+'M' : 'N/A',
      analystTarget,
      recommendation: rec,
      aiSummary,
      analysts:       isStock ? { strongBuy, buy, hold, sell, strongSell, bullPct } : null,
      fearGreed:      isCrypto ? { value: fngValue, label: fngLabel } : null,
      ma50:           ma50 > 0 ? parseFloat(ma50.toFixed(4)) : null,
      ma200:          ma200 > 0 ? parseFloat(ma200.toFixed(4)) : null,
      trend,
      trendVsMA200,
    })

  } catch (err) {
    console.error('[stock API]', err)
    return NextResponse.json({ error: `Ticker "${ticker}" not found` }, { status: 404 })
  }
}