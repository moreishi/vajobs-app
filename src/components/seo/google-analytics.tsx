import { unstable_noStore as noStore } from 'next/cache'
import { prisma } from '@/lib/prisma'

export async function GoogleAnalytics() {
  noStore()

  try {
    const setting = await prisma.paymentSetting.findUnique({
      where: { key: 'google_analytics_script' },
    })

    if (!setting?.value) return null

    return (
      <div
        dangerouslySetInnerHTML={{ __html: setting.value }}
      />
    )
  } catch {
    return null
  }
}
