import type { ChatMessage, Conversation } from '@/types'

export const conversations: Conversation[] = [
  { id: '1', title: 'Revenue analysis Q2', lastMessage: 'Your Q2 revenue grew 34% YoY...', timestamp: '2 min ago', unread: false },
  { id: '2', title: 'Churn prediction model', lastMessage: 'Based on the patterns I see...', timestamp: '1 hour ago', unread: true },
  { id: '3', title: 'Customer segment report', lastMessage: "I've identified 4 key segments...", timestamp: 'Yesterday', unread: false },
  { id: '4', title: 'Pricing strategy review', lastMessage: 'Comparing your tier structure...', timestamp: '2 days ago', unread: false },
  { id: '5', title: 'Growth opportunities', lastMessage: 'Three high-impact areas stand out...', timestamp: '3 days ago', unread: false },
]

export const initialMessages: ChatMessage[] = [
  {
    id: '1',
    role: 'assistant',
    content: "Hello! I'm your SmartFood AI assistant. I can help you analyze your business metrics, generate reports, identify trends, and answer questions about your data. What would you like to explore today?",
    timestamp: '10:00 AM',
  },
  {
    id: '2',
    role: 'user',
    content: 'Give me a summary of our Q2 revenue performance.',
    timestamp: '10:01 AM',
  },
  {
    id: '3',
    role: 'assistant',
    content: `**Q2 2026 Revenue Summary**

Your Q2 performance was strong across all key metrics:

- **Total Revenue:** $284,902 — up **+12.5%** vs Q1
- **MRR:** $94,967 (new record high)
- **ARR run rate:** $1.14M (crossed the $1M milestone in May)

**Top highlights:**
1. Enterprise segment drove 43% of total revenue (+28% QoQ)
2. Subscription upgrades increased by 23.1% — your Pro tier is resonating
3. Churn dropped from 1.7% → 1.4%, saving ~$18K in ARR

Want me to dig deeper into any segment?`,
    timestamp: '10:01 AM',
  },
]
