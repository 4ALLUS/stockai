import { NextRequest, NextResponse } from 'next/server'

const STOCKS: Record<string, any> = {
  'AAPL':    { name: 'Apple Inc.',           price: 172.30, change: 0.80,  changePct: 0.47,  marketCap: '$2.6T',  pe: '28.4x', eps: '$6.08',  beta: '1.24', week52High: 199.62, week52Low: 124.17, volume: '58.2M', analystTarget: 210.00, recommendation: 'Buy' },
  'NVDA':    { name: 'NVIDIA Corp.',          price: 875.40, change: 24.10, changePct: 2.83,  marketCap: '$2.1T',  pe: '68.2x', eps: '$12.96', beta: '1.66', week52High: 974.00, week52Low: 373.62, volume: '41.3M', analystTarget: 1050.00, recommendation: 'Strong Buy' },
  'PYPL':    { name: 'PayPal Holdings',       price: 48.92,  change: 0.53,  changePct: 1.09,  marketCap: '$71.2B', pe: '16.4x', eps: '$4.14',  beta: '1.42', week52High: 93.45,  week52Low: 44.18,  volume: '12.3M', analystTarget: 85.00,  recommendation: 'Buy' },
  'MSFT':    { name: 'Microsoft Corp.',       price: 415.20, change: 2.40,  changePct: 0.58,  marketCap: '$3.1T',  pe: '35.1x', eps: '$11.85', beta: '0.90', week52High: 468.35, week52Low: 309.45, volume: '18.7M', analystTarget: 490.00, recommendation: 'Strong Buy' },
  'TSLA':    { name: 'Tesla Inc.',            price: 175.34, change: -3.20, changePct: -1.79, marketCap: '$558B',  pe: '42.1x', eps: '$4.30',  beta: '2.31', week52High: 299.29, week52Low: 138.80, volume: '98.4M', analystTarget: 220.00, recommendation: 'Hold' },
  'GOOGL':   { name: 'Alphabet Inc.',         price: 175.98, change: 1.20,  changePct: 0.69,  marketCap: '$2.2T',  pe: '24.3x', eps: '$7.24',  beta: '1.06', week52High: 207.05, week52Low: 130.67, volume: '22.1M', analystTarget: 220.00, recommendation: 'Buy' },
  'AMZN':    { name: 'Amazon.com Inc.',       price: 198.12, change: 2.10,  changePct: 1.07,  marketCap: '$2.1T',  pe: '43.2x', eps: '$4.59',  beta: '1.15', week52High: 242.52, week52Low: 151.61, volume: '35.4M', analystTarget: 245.00, recommendation: 'Strong Buy' },
  'META':    { name: 'Meta Platforms',        price: 527.34, change: 8.40,  changePct: 1.62,  marketCap: '$1.3T',  pe: '28.7x', eps: '$19.27', beta: '1.22', week52High: 638.40, week52Low: 392.28, volume: '14.2M', analystTarget: 650.00, recommendation: 'Buy' },
  'BTC-USD': { name: 'Bitcoin USD',           price: 84250.00, change: 1200.00, changePct: 1.44, marketCap: '$1.6T', pe: 'N/A', eps: 'N/A', beta: 'N/A', week52High: 108353.00, week52Low: 49008.00, volume: '$38.2B', analystTarget: 120000.00, recommendation: 'Buy' },
  'ETH-USD': { name: 'Ethereum USD',          price: 1910.00, change: -45.00, changePct: -2.30, marketCap: '$230B', pe: 'N/A', eps: 'N/A', beta: 'N/A', week52High: 4107.00, week52Low: 1520.00, volume: '$18.4B', analystTarget: 4000.00, recommendation: 'Buy' },
  'RXRX':    { name: 'Recursion Pharmaceuticals', price: 6.84, change: -0.12, changePct: -1.72, marketCap: '$1.8B', pe: 'N/A', eps: '-$1.42', beta: '1.89', week52High: 17.00, week52Low: 4.85, volume: '8.4M', analystTarget: 14.00, recommendation: 'Buy' },
  'V':       { name: 'Visa Inc.',             price: 281.50, change: 1.30,  changePct: 0.46,  marketCap: '$598B',  pe: '32.1x', eps: '$9.92',  beta: '0.93', week52High: 316.00, week52Low: 252.72, volume: '6.8M',  analystTarget: 340.00, recommendation: 'Buy' },
  'JPM':     { name: 'JPMorgan Chase',        price: 238.40, change: 0.90,  changePct: 0.38,  marketCap: '$688B',  pe: '12.8x', eps: '$18.22', beta: '1.11', week52High: 280.25, week52Low: 183.52, volume: '9.2M',  analystTarget: 275.00, recommendation: 'Buy' },
  'NFLX':    { name: 'Netflix Inc.',          price: 968.00, change: 12.40, changePct: 1.30,  marketCap: '$415B',  pe: '52.3x', eps: '$19.44', beta: '1.28', week52High: 1064.50, week52Low: 542.01, volume: '3.1M', analystTarget: 1050.00, recommendation: 'Buy' },
  'DIS':     { name: 'Walt Disney Co.',       price: 111.20, change: -0.80, changePct: -0.71, marketCap: '$203B',  pe: '38.4x', eps: '$2.74',  beta: '1.44', week52High: 123.74, week52Low: 83.91,  volume: '11.2M', analystTarget: 130.00, recommendation: 'Hold' },
  'AMD':     { name: 'Advanced Micro Devices',price: 108.50, change: 2.30,  changePct: 2.17,  marketCap: '$176B',  pe: '96.1x', eps: '$1.13',  beta: '1.72', week52High: 227.30, week52Low: 94.27,  volume: '42.3M', analystTarget: 175.00, recommendation: 'Buy' },
  'INTC':    { name: 'Intel Corp.',           price: 21.80,  change: -0.30, changePct: -1.36, marketCap: '$93B',   pe: 'N/A',   eps: '-$4.38', beta: '1.01', week52High: 43.62,  week52Low: 18.51,  volume: '38.7M', analystTarget: 28.00,  recommendation: 'Hold' },
  'SPOT':    { name: 'Spotify Technology',    price: 628.40, change: 8.20,  changePct: 1.32,  marketCap: '$126B',  pe: '112x',  eps: '$5.63',  beta: '1.18', week52High: 688.56, week52Low: 239.74, volume: '1.8M',  analystTarget: 720.00, recommendation: 'Buy' },
  'UBER':    { name: 'Uber Technologies',     price: 72.40,  change: 1.10,  changePct: 1.54,  marketCap: '$152B',  pe: '22.4x', eps: '$3.23',  beta: '1.38', week52High: 87.00,  week52Low: 56.87,  volume: '18.3M', analystTarget: 95.00,  recommendation: 'Buy' },
  'COIN':    { name: 'Coinbase Global',       price: 196.30, change: -5.40, changePct: -2.68, marketCap: '$47B',   pe: '28.1x', eps: '$7.43',  beta: '3.12', week52High: 388.32, week52Low: 129.50, volume: '12.4M', analystTarget: 310.00, recommendation: 'Buy' },
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { ticker: string } }
) {
  const ticker = params.ticker.toUpperCase()
  const base   = STOCKS[ticker]

  if (!base) {
    return NextResponse.json(
      { error: `Ticker "${ticker}" not found. Try: AAPL, NVDA, BTC-USD, RXRX, TSLA...` },
      { status: 404 }
    )
  }

  let aiSummary = `${base.name} (${ticker}) is trading at $${base.price.toFixed(2)}, with analyst consensus ${base.recommendation} and mean target $${base.analystTarget.toFixed(2)}.`

  try {
    const Anthropic = (await import('@anthropic-ai/sdk')).default
    const client    = new Anthropic()
    const res = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      system: 'You are a financial analyst. Write a 3-sentence stock analysis in English using ONLY the data provided. Never invent numbers.',
      messages: [{
        role: 'user',
        content: `Analyze ${ticker}: Price $${base.price}, Change ${base.changePct}%, P/E ${base.pe}, Analyst target $${base.analystTarget}, Recommendation: ${base.recommendation}, 52W High $${base.week52High}, 52W Low $${base.week52Low}, Market Cap ${base.marketCap}.`
      }]
    })
    if (res.content[0].type === 'text') aiSummary = res.content[0].text
  } catch (e) {
    console.error('AI error:', e)
  }

  return NextResponse.json({ ticker, ...base, aiSummary })
}