import { NextRequest, NextResponse } from 'next/server'

function calcMA(closes: number[], period: number): number {
  const valid = closes.filter((v: any) => v != null && !isNaN(v))
  if (valid.length < period) return 0
  const slice = valid.slice(-period)
  return slice.reduce((a: number, b: number) => a + b, 0) / period
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { ticker: string } }
) {
  const ticker   = decodeURIComponent(params.ticker).toUpperCase()
  const AV_KEY   = process.env.ALPHA_VANTAGE_KEY ?? 'demo'
  const FH_KEY   = process.env.FINNHUB_KEY ?? 'd6usl79r01qig545o780d6usl79r01qig545o78g'
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
      requests.push(
        fetch(`https://finnhub.io/api/v1/stock/metric?symbol=${ticker}&metric=all&token=${FH_KEY}`)
      )
      requests.push(
        fetch(`https://finnhub.io/api/v1/stock/recommendation?symbol=${ticker}&token=${FH_KEY}`)
      )
    }

    if (isCrypto) {
      requests.push(fetch('https://api.alternative.me/fng/?limit=1'))
    }

    const responses  = await Promise.all(requests)
    const yahooData  = await responses[0].json()
    const avData     = isStock ? await responses[1].json() : null
    const fhMetrics  = isStock ? await responses[2].json() : null
    const fhRec      = isStock ? await responses[3].json() : null
    const cryptoData = isCrypto ? await responses[1].json() : null

    const meta       = yahooData?.chart?.result?.[0]?.meta
    const quotes     = yahooData?.chart?.result?.[0]?.indicators?.quote?.[0] ?? {}
    const closes     = quotes.close   ?? []
    const opens      = quotes.open    ?? []
    const highs      = quotes.high    ?? []
    const lows       = quotes.low     ?? []
    const volumes    = quotes.volume  ?? []
    const timestamps = yahooData?.chart?.result?.[0]?.timestamp ?? []

    if (!meta) return NextResponse.json(
      { error: `Ticker "${ticker}" not found` }, { status: 404 }
    )

    const price     = meta.regularMarketPrice ?? 0
    const prev      = meta.chartPreviousClose ?? meta.previousClose ?? price
    const change    = price - prev
    const changePct = prev > 0 ? (change / prev) * 100 : 0
    const volume    = meta.regularMarketVolume ?? 0

    const ma50  = calcMA(closes, 50)
    const ma200 = calcMA(closes, 200)
    const trend = ma50 > 0 && ma200 > 0
      ? ma50 > ma200 ? 'Golden Cross — Bullish' : 'Death Cross — Bearish'
      : null
    const trendVsMA200 = ma200 > 0
      ? price > ma200 ? 'Above MA200 — Bullish' : 'Below MA200 — Bearish'
      : null

    const history = closes
      .map((v: any, i: number) => ({
        date:   timestamps[i] ? new Date(timestamps[i] * 1000).toISOString().split('T')[0] : null,
        price:  v != null ? parseFloat(v.toFixed(4)) : null,
        open:   opens[i]   != null ? parseFloat(opens[i].toFixed(4))   : null,
        high:   highs[i]   != null ? parseFloat(highs[i].toFixed(4))   : null,
        low:    lows[i]    != null ? parseFloat(lows[i].toFixed(4))    : null,
        close:  v != null ? parseFloat(v.toFixed(4)) : null,
        volume: volumes[i]  != null ? Math.round(volumes[i]) : null,
      }))
      .filter((d: any) => d.date && d.price != null)
      .slice(-252)

    // Alpha Vantage fundamentals
    const av = avData && avData.Symbol ? avData : null

    // Finnhub fundamentals as fallback
    const fhM = fhMetrics?.metric ?? {}

    // P/E — AV first, then Finnhub, then Yahoo
    const pe = av?.PERatio && parseFloat(av.PERatio) > 0
      ? parseFloat(av.PERatio).toFixed(1) + 'x'
      : fhM['peNormalizedAnnual'] ? parseFloat(fhM['peNormalizedAnnual']).toFixed(1) + 'x'
      : meta.trailingPE ? parseFloat(meta.trailingPE).toFixed(1) + 'x'
      : 'N/A'

    // EPS
    const eps = av?.EPS && parseFloat(av.EPS) !== 0
      ? av.EPS
      : fhM['epsNormalizedAnnual'] ? parseFloat(fhM['epsNormalizedAnnual']).toFixed(2)
      : 'N/A'

    // Beta
    const beta = av?.Beta && parseFloat(av.Beta) > 0
      ? parseFloat(av.Beta).toFixed(2)
      : fhM['beta'] ? parseFloat(fhM['beta']).toFixed(2)
      : 'N/A'

    // Market cap
    const marketCap = av?.MarketCapitalization && parseInt(av.MarketCapitalization) > 0
      ? '$' + (parseInt(av.MarketCapitalization)/1e9).toFixed(1) + 'B'
      : meta.marketCap ? '$' + (meta.marketCap/1e9).toFixed(1) + 'B'
      : fhM['marketCapitalization'] ? '$' + (fhM['marketCapitalization']/1e3).toFixed(1) + 'B'
      : 'N/A'

    // 52W
    const week52High = parseFloat(av?.['52WeekHigh'] ?? '0') || fhM['52WeekHigh'] || meta.fiftyTwoWeekHigh || 0
    const week52Low  = parseFloat(av?.['52WeekLow']  ?? '0') || fhM['52WeekLow']  || meta.fiftyTwoWeekLow  || 0

    // Analyst target
    const analystTarget = av?.AnalystTargetPrice && parseFloat(av.AnalystTargetPrice) > 0
      ? parseFloat(av.AnalystTargetPrice)
      : fhM['targetMedian'] ? parseFloat(fhM['targetMedian'])
      : 0

    // Analyst ratings — AV first, then Finnhub
    let strongBuy = 0, buy = 0, hold = 0, sell = 0, strongSell = 0

    if (av?.AnalystRatingStrongBuy && parseInt(av.AnalystRatingStrongBuy) > 0) {
      strongBuy  = parseInt(av.AnalystRatingStrongBuy ?? '0')
      buy        = parseInt(av.AnalystRatingBuy ?? '0')
      hold       = parseInt(av.AnalystRatingHold ?? '0')
      sell       = parseInt(av.AnalystRatingSell ?? '0')
      strongSell = parseInt(av.AnalystRatingStrongSell ?? '0')
    } else if (fhRec && Array.isArray(fhRec) && fhRec.length > 0) {
      const latest = fhRec[0]
      strongBuy  = latest.strongBuy  ?? 0
      buy        = latest.buy        ?? 0
      hold       = latest.hold       ?? 0
      sell       = latest.sell       ?? 0
      strongSell = latest.strongSell ?? 0
    }

    const totalAnalysts = strongBuy + buy + hold + sell + strongSell
    const bullPct = totalAnalysts > 0 ? Math.round((strongBuy + buy) / totalAnalysts * 100) : 0
    const rec     = isStock && totalAnalysts > 0
      ? (bullPct >= 60 ? 'Buy' : bullPct >= 40 ? 'Hold' : 'Sell')
      : 'N/A'

    // Crypto Fear & Greed
    const fng      = isCrypto ? cryptoData?.data?.[0] : null
    const fngValue = fng ? parseInt(fng.value) : null
    const fngLabel = fng?.value_classification ?? null

    let aiSummary = `${av?.Name ?? meta.shortName ?? ticker} is trading at $${price.toFixed(2)}.`

    try {
      const Anthropic = (await import('@anthropic-ai/sdk')).default
      const client = new Anthropic()
      const content = isStock
        ? `Analyze ${ticker} (${av?.Name ?? meta.shortName ?? ticker}): Price $${price.toFixed(2)}, Change ${changePct.toFixed(2)}%, P/E ${pe}, EPS $${eps}, Beta ${beta}, 52W High $${week52High}, 52W Low $${week52Low}, Analyst target $${analystTarget > 0 ? analystTarget.toFixed(2) : 'N/A'}, Recommendation: ${rec}, MA50: $${ma50.toFixed(4)}, MA200: $${ma200.toFixed(4)}, Trend: ${trend ?? 'N/A'}.`
        : `Analyze ${ticker}: Price $${price.toFixed(2)}, Change ${changePct.toFixed(2)}%, 52W High $${week52High}, 52W Low $${week52Low}, MA50: $${ma50.toFixed(4)}, MA200: $${ma200.toFixed(4)}, Trend: ${trend ?? trendVsMA200 ?? 'N/A'}${fngValue ? `, Fear & Greed Index: ${fngValue} (${fngLabel})` : ''}.`

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
      name:       av?.Name ?? meta.shortName ?? meta.longName ?? ticker,
      price,
      change:     parseFloat(change.toFixed(2)),
      changePct:  parseFloat(changePct.toFixed(2)),
      marketCap,
      pe,
      eps,
      beta,
      week52High,
      week52Low,
      volume:     volume ? (volume/1e6).toFixed(1)+'M' : 'N/A',
      analystTarget,
      recommendation: rec,
      aiSummary,
      analysts:   isStock && totalAnalysts > 0
        ? { strongBuy, buy, hold, sell, strongSell, bullPct }
        : null,
      fearGreed:  isCrypto ? { value: fngValue, label: fngLabel } : null,
      ma50:       ma50 > 0 ? parseFloat(ma50.toFixed(4)) : null,
      ma200:      ma200 > 0 ? parseFloat(ma200.toFixed(4)) : null,
      trend,
      trendVsMA200,
      history,
    })

  } catch (err) {
    console.error('[stock API]', err)
    return NextResponse.json({ error: `Ticker "${ticker}" not found` }, { status: 404 })
  }
}