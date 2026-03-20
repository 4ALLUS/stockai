import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'StockAI — AI-powered stock analysis',
  description: 'Real-time AI stock analysis, portfolio tracking, and PDF reports. Verified data, no hallucinations.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
