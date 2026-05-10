export const CONNECT_PACKAGES = [
  { amount: 10, price: 5 },
  { amount: 25, price: 10 },
  { amount: 50, price: 18 },
  { amount: 100, price: 30 },
] as const

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  JOBS: '/jobs',
  JOB_DETAIL: (id: string) => `/jobs/${id}` as const,
  NEW_JOB: '/dashboard/jobs/new',
  EDIT_JOB: (id: string) => `/dashboard/jobs/${id}/edit` as const,
  ENGAGEMENTS: '/dashboard/engagements',
  ENGAGEMENT_DETAIL: (id: string) => `/dashboard/engagements/${id}` as const,
  SAVED_JOBS: '/dashboard/saved-jobs',
  DASHBOARD_APPLICATIONS: '/dashboard/applications',
  DASHBOARD_APPLICATION_DETAIL: (id: string) => `/dashboard/applications/${id}` as const,
  TALENTS: '/talents',
  TALENT_DETAIL: (id: string) => `/talents/${id}` as const,
  PROFILE: '/dashboard/profile',
  CLIENT_PROFILE: '/dashboard/client-profile',
  CLIENT_PROFILE_DETAIL: (id: string) => `/clients/${id}` as const,
  SETTINGS: '/dashboard/settings',
  NOTIFICATIONS: '/dashboard/notifications',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  RESET_PASSWORD_LINK: (token: string) => `/reset-password?token=${token}` as const,
  ADMIN_PAYMENTS: '/dashboard/admin/payments',
  SUBSCRIPTIONS: '/dashboard/subscriptions',
  ADMIN_SUBSCRIPTIONS: '/dashboard/admin/subscriptions',
  SAVED_SEARCHES: '/dashboard/saved-searches',
} as const

export const COMMON_SKILLS = [
  'Administrative Support', 'Customer Service', 'Data Entry', 'Social Media Management',
  'Bookkeeping', 'Email Management', 'Calendar Management', 'Project Management',
  'Content Writing', 'Graphic Design', 'Video Editing', 'Web Development',
  'SEO', 'Digital Marketing', 'Sales', 'Lead Generation',
] as const
