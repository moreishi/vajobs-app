export interface ReferralConversionStats {
  totalReferrals: number
  converted: number
  pending: number
  conversionRate: number
}

export function getReferralConversionStats(
  referredUsers: { referralRewardsReceived: { amount: number }[] }[],
): ReferralConversionStats {
  const totalReferrals = referredUsers.length
  const converted = referredUsers.filter(u => u.referralRewardsReceived.length > 0).length
  const pending = totalReferrals - converted
  const conversionRate = totalReferrals > 0 ? Math.round((converted / totalReferrals) * 100) : 0
  return { totalReferrals, converted, pending, conversionRate }
}
