import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SettingsForm } from '@/components/dashboard/settings-form'
import { ProfilePhotoUpload } from '@/components/dashboard/profile-photo-upload'

export default async function SettingsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      image: true,
      referralCode: true,
      referredBy: { select: { name: true, email: true } },
      referralRewardsGiven: { select: { amount: true } },
    },
  })

  const totalEarned = user?.referralRewardsGiven.reduce((sum, r) => sum + r.amount, 0) ?? 0

  return (
    <div className="space-y-8">
      <ProfilePhotoUpload currentImage={user?.image ?? null} userName={user?.name ?? null} />
      <SettingsForm name={user?.name ?? null} email={user?.email ?? ''} />

      {user?.referralCode && (
        <Card>
          <CardHeader>
            <CardTitle>Referral Program</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Your Referral Code</span>
              <p className="mt-1 font-mono text-lg font-bold">{user.referralCode}</p>
            </div>
            {totalEarned > 0 && (
              <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                <span className="text-sm text-muted-foreground">Total connects earned from referrals</span>
                <span className="text-lg font-bold text-green-600 dark:text-green-400">+{totalEarned}</span>
              </div>
            )}
            {user.referredBy && (
              <p className="text-xs text-muted-foreground">
                You were referred by {user.referredBy.name || user.referredBy.email}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Share your code with friends. You both earn connects when they sign up and complete their first action.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
