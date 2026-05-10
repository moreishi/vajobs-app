import { getNotificationPreferences, updateNotificationPreference } from '@/actions/notification-preferences'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TogglePreference } from './toggle-preference'

export async function NotificationPreferencesForm() {
  const preferences = await getNotificationPreferences()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Email Notification Preferences</CardTitle>
      </CardHeader>
      <CardContent>
        {preferences.length === 0 ? (
          <p className="text-sm text-muted-foreground">Log in to manage notification preferences.</p>
        ) : (
          <div className="divide-y">
            {preferences.map((pref) => (
              <div key={pref.type} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{pref.label}</p>
                  <p className="text-xs text-muted-foreground">{pref.description}</p>
                </div>
                <div className="ml-4 shrink-0">
                  <TogglePreference type={pref.type} enabled={pref.email} />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
