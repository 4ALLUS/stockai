import { NextRequest, NextResponse } from 'next/server'

const CRYPTO_MAP: Record<string, { symbol: string; name: string }> = {
  'bitcoin':   { symbol: 'BTC-USD',  name: 'Bitcoin' },
  'ethereum':  { symbol: 'ETH-USD',  name: 'Ethereum' },
  'solana':    { symbol: 'SOL-USD',  name: 'Solana' },
  'xrp':       { symbol: 'XRP-USD',  name: 'XRP (Ripple)' },
  'dogecoin':  { symbol: 'DOGE-USD', name: 'Dogecoin' },
  'cardano':   { symbol: 'ADA-USD',  name: 'Cardano' },
  'bnb':       { symbol: 'BNB-USD',  name: 'Binance Coin' },
  'polkadot':  { symbol: 'DOT-USD',  name: 'Polkadot' },
  'avalanche': { symbol: 'AVAX-USD', name: 'Avalanche' },
  'chainlink': { symbol: 'LINK-USD', name: 'Chainlink' },
  'litecoin':  { symbol: 'LTC-USD',  name: 'Litecoin' },
  'uniswap':   { symbol: 'UNI-USD',  name: 'Uniswap' },
}

const INDEX_MAP: Record<string, { symbol: string; name: string }> = {
  'sp500':     { symbol: '^GSPC',      name: 'S&P 500' },
  'sp':        { symbol: '^GSPC',      name: 'S&P 500' },
  'nasdaq':    { symbol: '^IXIC',      name: 'NASDAQ Composite' },
  'dow':       { symbol: '^DJI',       name: 'Dow Jones' },
  'russell':   { symbol: '^RUT',       name: 'Russell 2000' },
  'ftse':      { symbol: '^FTSE',      name: 'FTSE 100' },
  'dax':       { symbol: '^GDAXI',     name: 'DAX' },
  'mib':       { symbol: 'FTSEMIB.MI', name: 'FTSE MIB (Italy)' },
  'italy':     { symbol: 'FTSEMIB.MI', name: 'FTSE MIB (Italy)' },
  'vix':       { symbol: '^VIX',       name: 'VIX Volatility Index' },
  'nikkei':    { symbol: '^N225',      name: 'Nikkei 225' },
  'hangseng':  { symbol: '^HSI',       name: 'Hang Seng' },
  'cac':       { symbol: '^FCHI',      name: 'CAC 40' },
  'ibex':      { symbol: '^IBEX',      name: 'IBEX 35' },
}

const COMMODITY_MAP: Record<string, { symbol: string; name: string }> = {
  'gold':      { symbol: 'GC=F',  name: 'Gold Futures' },
  'oro':       { symbol: 'GC=F',  name: 'Gold Futures' },
  'silver':    { symbol: 'SI=F',  name: 'Silver Futures' },
  'argento':   { symbol: 'SI=F',  name: 'Silver Futures' },
  'oil':       { symbol: 'CL=F',  name: 'Crude Oil WTI' },
  'petrolio':  { symbol: 'CL=F',  name: 'Crude Oil WTI' },
  'brent':     { symbol: 'BZ=F',  name: 'Brent Crude Oil' },
  'gas':       { symbol: 'NG=F',  name: 'Natural Gas' },
  'copper':    { symbol: 'HG=F',  name: 'Copper Futures' },
  'rame':      { symbol: 'HG=F',  name: 'Copper Futures' },
  'wheat':     { symbol: 'ZW=F',  name: 'Wheat Futures' },
  'grano':     { symbol: 'ZW=F',  name: 'Wheat Futures' },
  'corn':      { symbol: 'ZC=F',  name: 'Corn Futures' },
  'platinum':  { symbol: 'PL=F',  name: 'Platinum Futures' },
}

const FOREX_MAP: Record<string, { symbol: string; name: string }> = {
  'eurusd':    { symbol: 'EURUSD=X', name: 'EUR/USD' },
  'euro':      { symbol: 'EURUSD=X', name: 'EUR/USD' },
  'gbpusd':    { symbol: 'GBPUSD=X', name: 'GBP/USD' },
  'pound':     { symbol: 'GBPUSD=X', name: 'GBP/USD' },
  'sterlina':  { symbol: 'GBPUSD=X', name: 'GBP/USD' },
  'usdjpy':    { symbol: 'JPY=X',    name: 'USD/JPY' },
  'yen':       { symbol: 'JPY=X',    name: 'USD/JPY' },
  'usdchf':    { symbol: 'CHF=X',    name: 'USD/CHF' },
  'franco':    { symbol: 'CHF=X',    name: 'USD/CHF' },
  'audusd':    { symbol: 'AUDUSD=X', name: 'AUD/USD' },
  'usdcad':    { symbol: 'CAD=X',    name: 'USD/CAD' },
  'eurgbp':    { symbol: 'EURGBP=X', name: 'EUR/GBP' },
  'dollar':    { symbol: 'DX-Y.NYB', name: 'US Dollar Index' },
  'dollaro':   { symbol: 'DX-Y.NYB', name: 'US Dollar Index' },
}

const ETF_MAP: Record<string, { symbol: string; name: string }> = {
  'spy':      { symbol: 'SPY',     name: 'SPDR S&P 500 ETF' },
  'qqq':      { symbol: 'QQQ',     name: 'Invesco NASDAQ 100 ETF' },
  'vwce':     { symbol: 'VWCE.DE', name: 'Vanguard FTSE All-World ETF' },
  'vanguard': { symbol: 'VTI',     name: 'Vanguard Total Stock Market ETF' },
  'ark':      { symbol: 'ARKK',    name: 'ARK Innovation ETF' },
  'gld':      { symbol: 'GLD',     name: 'SPDR Gold Shares ETF' },
  'iwm':      { symbol: 'IWM',     name: 'iShares Russell 2000 ETF' },
  'eem':      { symbol: 'EEM',     name: 'iShares MSCI Emerging Markets ETF' },
  'tlt':      { symbol: 'TLT',     name: 'iShares 20+ Year Treasury Bond ETF' },
  'xsp':      { symbol: 'CSPX.L', name: 'iShares Core S&P 500 ETF' },
  'msci':     { symbol: 'URTH',   name: 'iShares MSCI World ETF' },
  'world':    { symbol: 'URTH',   name: 'iShares MSCI World ETF' },
}

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get('q') ?? '').trim().toLowerCase()
  if (q.length < 2) return NextResponse.json({ suggestions: [] })

  const suggestions: any[] = []

  const maps = [
    { map: CRYPTO_MAP,    exchDisp: 'Crypto',    typeDisp: 'Cryptocurrency' },
    { map: INDEX_MAP,     exchDisp: 'Index',      typeDisp: 'Index' },
    { map: COMMODITY_MAP, exchDisp: 'Commodity',  typeDisp: 'Futures' },
    { map: FOREX_MAP,     exchDisp: 'Forex',      typeDisp: 'Currency' },
    { map: ETF_MAP,       exchDisp: 'ETF',        typeDisp: 'ETF' },
  ]

  for (const { map, exchDisp, typeDisp } of maps) {
    for (const [key, val] of Object.entries(map)) {
      if (key.includes(q) || q.includes(key) || val.name.toLowerCase().includes(q)) {
        if (!suggestions.find(s => s.symbol === val.symbol)) {
          suggestions.push({ symbol: val.symbol, name: val.name, exchDisp, typeDisp })
        }
      }
    }
  }

  try {
    const res  = await fetch(
      `https://finnhub.io/api/v1/search?q=${encodeURIComponent(q)}&token=d6usl79r01qig545o780d6usl79r01qig545o78g`
    )
    const data = await res.json()
    const stocks = (data?.result ?? [])
      .filter((r: any) => r.symbol && r.description)
      .slice(0, 6)
      .map((r: any) => ({
        symbol:   r.symbol,
        name:     r.description,
        exchDisp: r.primaryExchange ?? '',
        typeDisp: r.type ?? 'Equity',
      }))
    suggestions.push(...stocks)
  } catch (err) {
    console.error('[search]', err)
  }

  return NextResponse.json({ suggestions: suggestions.slice(0, 8) })
}