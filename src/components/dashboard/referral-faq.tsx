'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface FaqItem {
  q: string
  a: string
}

export const faqItems: FaqItem[] = [
  {
    q: 'How does the referral program work?',
    a: 'Share your unique referral link with friends. When someone clicks your link, they land on a welcome page that introduces the platform. After signing up using your referral code and completing their first action (apply to a job or post a job), both you and your friend earn connects.',
  },
  {
    q: 'Where does my referral link send people?',
    a: 'Your referral link sends people to a welcome page tailored to their likely role. Talent referrals go to /hello-va which showcases VA job opportunities, and client referrals go to /hello-startup which highlights hiring benefits. The referral code is carried through automatically to the registration form.',
  },
  {
    q: 'How many connects do I earn?',
    a: 'You earn 10 connects when a referred talent submits their first application, and 15 connects when a referred client posts their first job. Your friend earns the same amount.',
  },
  {
    q: 'What are milestone bonuses?',
    a: 'When you reach 3, 5, or 10 successful referrals, you earn extra bonus connects. Milestone bonuses are 20, 50, and 100 connects respectively, awarded automatically on top of your regular referral earnings.',
  },
  {
    q: 'Is there a limit to how many people I can refer?',
    a: 'No, there is no limit. You can refer as many people as you want, and you will earn connects for every successful referral.',
  },
  {
    q: 'What happens if my referral code is used by someone else?',
    a: 'Only the first person to use your referral code gets the reward. If someone accidentally uses the wrong code, the reward goes to the referrer whose code was actually used during sign-up.',
  },
]

function FaqItem({ item }: { item: FaqItem }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-3 text-left text-sm font-medium hover:text-foreground/80"
      >
        {item.q}
        <span className={`ml-2 shrink-0 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`}>
          ▾
        </span>
      </button>
      {open && (
        <div className="pb-3 text-sm text-muted-foreground">
          {item.a}
        </div>
      )}
    </div>
  )
}

export function ReferralFAQ() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Referral FAQ</CardTitle>
      </CardHeader>
      <CardContent className="space-y-0">
        {faqItems.map((item, i) => (
          <FaqItem key={i} item={item} />
        ))}
      </CardContent>
    </Card>
  )
}
