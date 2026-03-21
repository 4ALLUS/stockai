import { NextResponse } from 'next/server'

export async function GET() {
  const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY

  if (!ANTHROPIC_KEY) {
    return NextResponse.json({ summary: 'Debug: ANTHROPIC_API_KEY missing' })
  }

  try {
    const today = new Date().toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    })

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
        system: 'You are a financial market analyst. Write a brief 2-sentence general market outlook in English.',
        messages: [{
          role: 'user',
          content: `Today is ${today}. Write a 2-sentence market overview covering general conditions, tech sector, and investor sentiment.`
        }]
      })
    })

    const text = await res.text()
    
    if (!res.ok) {
      return NextResponse.json({ summary: 'API error ' + res.status + ': ' + text.slice(0, 200) })
    }

    const data = JSON.parse(text)
    const summary = data?.content?.[0]?.text

    if (!summary) {
      return NextResponse.json({ summary: 'Parse error: ' + text.slice(0, 200) })
    }

    return NextResponse.json({ summary })

  } catch (err: any) {
    return NextResponse.json({ summary: 'Exception: ' + err.message })
  }
}