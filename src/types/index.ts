export interface StockData {
  ticker:         string
  name:           string
  price:          number
  change:         number
  changePct:      number
  marketCap:      string
  pe:             string
  eps:            string
  beta:           string
  week52High:     number
  week52Low:      number
  volume:         string
  analystTarget:  number
  recommendation: string
  aiSummary:      string
}

export interface Position {
  id:        string
  ticker:    string
  name:      string
  shares:    number
  avgCost:   number
  userId:    string
  createdAt: string
}

export interface Subscription {
  userId:           string
  status:           'trial' | 'active' | 'cancelled'
  stripeCustomerId: string
  trialEndsAt:      string
  currentPeriodEnd: string
}

export interface User {
  id:       string
  email:    string
  fullName: string
  plan:     'free' | 'pro' | 'annual'
}
