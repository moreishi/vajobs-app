import { getUnreadCount } from '@/actions/notifications'
import { NotificationDropdown } from './notification-dropdown'

export async function NotificationBell() {
  const count = await getUnreadCount()

  return <NotificationDropdown initialCount={count} />
}
