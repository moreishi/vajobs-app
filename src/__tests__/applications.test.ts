import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: vi.fn(), findMany: vi.fn(), update: vi.fn() },
    jobPost: { findUnique: vi.fn() },
    application: { findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn() },
    conversation: { findUnique: vi.fn(), create: vi.fn() },
    message: { create: vi.fn() },
    interview: { update: vi.fn(), upsert: vi.fn() },
    connectTransaction: { create: vi.fn() },
    notification: { create: vi.fn(), count: vi.fn(), findMany: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
    $transaction: vi.fn(),
  },
}))

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}))

const { prisma } = await import('@/lib/prisma')
const { auth } = await import('@/lib/auth')

let applyToJob: typeof import('@/actions/applications').applyToJob
let updateApplicationStatus: typeof import('@/actions/applications').updateApplicationStatus
let withdrawApplication: typeof import('@/actions/applications').withdrawApplication
let sendMessage: typeof import('@/actions/applications').sendMessage
let scheduleInterview: typeof import('@/actions/applications').scheduleInterview
let cancelInterview: typeof import('@/actions/applications').cancelInterview
let getApplicationById: typeof import('@/actions/applications').getApplicationById

const mockUser = {
  id: 'talent-id',
  email: 'talent@example.com',
  password: 'hashed',
  role: 'talent',
  name: null,
  emailVerified: null,
  image: null,
  connects: 10,
  lastConnectsReset: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}

const mockClientUser = {
  ...mockUser,
  id: 'client-id',
  email: 'client@example.com',
  role: 'client',
}

const mockJob = {
  id: 'job-id',
  title: 'Test Job',
  description: 'Test description',
  shortDescription: null,
  location: 'Remote',
  type: 'full-time',
  salaryRange: '$100k',
  skills: '[]',
  status: 'open',
  posterId: 'client-id',
  posterName: 'client',
  createdAt: new Date(),
  updatedAt: new Date(),
}

const mockApplication = {
  id: 'app-id',
  jobPostId: 'job-id',
  applicantId: 'talent-id',
  coverLetter: 'I am a great fit!',
  status: 'pending',
  biddingConnects: 5,
  createdAt: new Date(),
  updatedAt: new Date(),
}

beforeEach(async () => {
  vi.clearAllMocks()
  const mod = await import('@/actions/applications')
  applyToJob = mod.applyToJob
  updateApplicationStatus = mod.updateApplicationStatus
  withdrawApplication = mod.withdrawApplication
  sendMessage = mod.sendMessage
  scheduleInterview = mod.scheduleInterview
  cancelInterview = mod.cancelInterview
  getApplicationById = mod.getApplicationById
})

describe('applyToJob', () => {
  it('returns error when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValueOnce(null)
    const formData = new FormData()
    const result = await applyToJob('job-id', formData)
    expect(result).toEqual({ error: 'Not authenticated' })
  })

  it('returns error when role is not talent', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'client-id', role: 'client' } } as any)
    const formData = new FormData()
    const result = await applyToJob('job-id', formData)
    expect(result).toEqual({ error: 'Only talents can apply to jobs' })
  })

  it('returns error when job not found', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'talent-id', role: 'talent' } } as any)
    vi.mocked(prisma.jobPost.findUnique).mockResolvedValueOnce(null)
    const formData = new FormData()
    const result = await applyToJob('job-id', formData)
    expect(result).toEqual({ error: 'Job not found' })
  })

  it('returns error when job is closed', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'talent-id', role: 'talent' } } as any)
    vi.mocked(prisma.jobPost.findUnique).mockResolvedValueOnce({ ...mockJob, status: 'closed' })
    const formData = new FormData()
    const result = await applyToJob('job-id', formData)
    expect(result).toEqual({ error: 'This job is no longer accepting applications' })
  })

  it('returns error on duplicate application', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'talent-id', role: 'talent' } } as any)
    vi.mocked(prisma.jobPost.findUnique).mockResolvedValueOnce(mockJob)
    vi.mocked(prisma.application.findUnique).mockResolvedValueOnce(mockApplication)
    const formData = new FormData()
    const result = await applyToJob('job-id', formData)
    expect(result).toEqual({ error: 'You have already applied to this job' })
  })

  it('returns error when user has insufficient connects', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'talent-id', role: 'talent' } } as any)
    vi.mocked(prisma.jobPost.findUnique).mockResolvedValueOnce(mockJob)
    vi.mocked(prisma.application.findUnique).mockResolvedValueOnce(null)
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({ connects: 0 })

    const formData = new FormData()
    formData.set('biddingConnects', '5')

    const result = await applyToJob('job-id', formData)

    expect(result).toEqual({ error: 'Insufficient connects. You have 0 connects but need 5.' })
  })

  it('creates application with bidding connects and deducts from user', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'talent-id', role: 'talent' } } as any)
    vi.mocked(prisma.jobPost.findUnique).mockResolvedValueOnce(mockJob)
    vi.mocked(prisma.application.findUnique).mockResolvedValueOnce(null)
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({ connects: 10 })
    vi.mocked(prisma.$transaction).mockResolvedValueOnce([mockApplication, {}])

    const formData = new FormData()
    formData.set('coverLetter', 'I am a great fit!')
    formData.set('biddingConnects', '5')

    await applyToJob('job-id', formData)

    expect(prisma.$transaction).toHaveBeenCalledWith([
      prisma.application.create({
        data: {
          jobPostId: 'job-id',
          applicantId: 'talent-id',
          coverLetter: 'I am a great fit!',
          biddingConnects: 5,
          conversation: { create: {} },
        },
      }),
      prisma.user.update({
        where: { id: 'talent-id' },
        data: { connects: { decrement: 5 } },
      }),
      prisma.connectTransaction.create({
        data: {
          userId: 'talent-id',
          amount: -5,
          type: 'application',
          description: 'Applied to "Test Job"',
        },
      }),
    ])
    const { revalidatePath } = await import('next/cache')
    const { redirect } = await import('next/navigation')
    expect(revalidatePath).toHaveBeenCalled()
    expect(redirect).toHaveBeenCalledWith('/dashboard/applications')
  })
})

describe('updateApplicationStatus', () => {
  it('returns error when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValueOnce(null)
    const formData = new FormData()
    const result = await updateApplicationStatus('app-id', formData)
    expect(result).toEqual({ error: 'Not authenticated' })
  })

  it('returns error for invalid status', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'client-id' } } as any)
    const formData = new FormData()
    formData.set('status', 'invalid')
    const result = await updateApplicationStatus('app-id', formData)
    expect(result).toEqual({ error: 'Invalid status' })
  })

  it('returns error when application not found', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'client-id' } } as any)
    vi.mocked(prisma.application.findUnique).mockResolvedValueOnce(null)
    const formData = new FormData()
    formData.set('status', 'reviewed')
    const result = await updateApplicationStatus('app-id', formData)
    expect(result).toEqual({ error: 'Application not found' })
  })

  it('returns error when not the job poster', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'other-id' } } as any)
    vi.mocked(prisma.application.findUnique).mockResolvedValueOnce({
      ...mockApplication,
      jobPost: { posterId: 'client-id', title: 'Test Job' },
    })
    const formData = new FormData()
    formData.set('status', 'reviewed')
    const result = await updateApplicationStatus('app-id', formData)
    expect(result).toEqual({ error: 'Only the job poster can update application status' })
  })

  it('updates status successfully', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'client-id' } } as any)
    vi.mocked(prisma.application.findUnique).mockResolvedValueOnce({
      ...mockApplication,
      jobPost: { posterId: 'client-id', title: 'Test Job' },
    })
    vi.mocked(prisma.application.update).mockResolvedValueOnce(mockApplication)

    const formData = new FormData()
    formData.set('status', 'reviewed')
    const result = await updateApplicationStatus('app-id', formData)

    expect(prisma.application.update).toHaveBeenCalledWith({
      where: { id: 'app-id' },
      data: { status: 'reviewed' },
    })
    expect(result).toEqual({ success: true })
  })
})

describe('withdrawApplication', () => {
  it('returns error when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValueOnce(null)
    const result = await withdrawApplication('app-id')
    expect(result).toEqual({ error: 'Not authenticated' })
  })

  it('returns error when not the applicant', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'other-id' } } as any)
    vi.mocked(prisma.application.findUnique).mockResolvedValueOnce(mockApplication)
    const result = await withdrawApplication('app-id')
    expect(result).toEqual({ error: 'Not authorized' })
  })

  it('returns error when status is terminal', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'talent-id' } } as any)
    vi.mocked(prisma.application.findUnique).mockResolvedValueOnce({
      ...mockApplication,
      status: 'accepted',
    })
    const result = await withdrawApplication('app-id')
    expect(result).toEqual({ error: 'Cannot withdraw from a closed application' })
  })

  it('withdraws application successfully', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'talent-id' } } as any)
    vi.mocked(prisma.application.findUnique).mockResolvedValueOnce(mockApplication)
    vi.mocked(prisma.application.update).mockResolvedValueOnce({
      ...mockApplication,
      status: 'withdrawn',
    })

    const result = await withdrawApplication('app-id')

    expect(prisma.application.update).toHaveBeenCalledWith({
      where: { id: 'app-id' },
      data: { status: 'withdrawn' },
    })
    expect(result).toEqual({ success: true })
  })
})

describe('sendMessage', () => {
  it('returns error when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValueOnce(null)
    const formData = new FormData()
    const result = await sendMessage('app-id', formData)
    expect(result).toEqual({ error: 'Not authenticated' })
  })

  it('returns error on empty content', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'talent-id' } } as any)
    const formData = new FormData()
    formData.set('content', '  ')
    const result = await sendMessage('app-id', formData)
    expect(result).toEqual({ error: 'Message cannot be empty' })
  })

  it('returns error when application not found', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'talent-id' } } as any)
    vi.mocked(prisma.application.findUnique).mockResolvedValueOnce(null)
    const formData = new FormData()
    formData.set('content', 'Hello!')
    const result = await sendMessage('app-id', formData)
    expect(result).toEqual({ error: 'Application not found' })
  })

  it('returns error when not a participant', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'other-id' } } as any)
    vi.mocked(prisma.application.findUnique).mockResolvedValueOnce({
      ...mockApplication,
      jobPost: { posterId: 'client-id', title: 'Test Job' },
    })
    const formData = new FormData()
    formData.set('content', 'Hello!')
    const result = await sendMessage('app-id', formData)
    expect(result).toEqual({ error: 'Not authorized' })
  })

  it('creates conversation if missing and sends message', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'talent-id' } } as any)
    vi.mocked(prisma.application.findUnique).mockResolvedValueOnce({
      ...mockApplication,
      jobPost: { posterId: 'client-id', title: 'Test Job' },
    })
    vi.mocked(prisma.conversation.findUnique).mockResolvedValueOnce(null)
    vi.mocked(prisma.conversation.create).mockResolvedValueOnce({
      id: 'conv-id',
      applicationId: 'app-id',
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    vi.mocked(prisma.message.create).mockResolvedValueOnce({
      id: 'msg-id',
      conversationId: 'conv-id',
      senderId: 'talent-id',
      content: 'Hello!',
      createdAt: new Date(),
    })

    const formData = new FormData()
    formData.set('content', 'Hello!')
    const result = await sendMessage('app-id', formData)

    expect(prisma.conversation.create).toHaveBeenCalledWith({ data: { applicationId: 'app-id' } })
    expect(prisma.message.create).toHaveBeenCalledWith({
      data: { conversationId: 'conv-id', senderId: 'talent-id', content: 'Hello!' },
    })
    expect(result).toEqual({ success: true })
  })

  it('sends message to existing conversation', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'client-id' } } as any)
    vi.mocked(prisma.application.findUnique).mockResolvedValueOnce({
      ...mockApplication,
      jobPost: { posterId: 'client-id', title: 'Test Job' },
    })
    vi.mocked(prisma.conversation.findUnique).mockResolvedValueOnce({
      id: 'conv-id',
      applicationId: 'app-id',
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    vi.mocked(prisma.message.create).mockResolvedValueOnce({
      id: 'msg-id',
      conversationId: 'conv-id',
      senderId: 'client-id',
      content: 'Thanks for applying!',
      createdAt: new Date(),
    })

    const formData = new FormData()
    formData.set('content', 'Thanks for applying!')
    const result = await sendMessage('app-id', formData)

    expect(prisma.conversation.create).not.toHaveBeenCalled()
    expect(prisma.message.create).toHaveBeenCalledWith({
      data: { conversationId: 'conv-id', senderId: 'client-id', content: 'Thanks for applying!' },
    })
    expect(result).toEqual({ success: true })
  })
})

describe('scheduleInterview', () => {
  it('returns error when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValueOnce(null)
    const formData = new FormData()
    const result = await scheduleInterview('app-id', formData)
    expect(result).toEqual({ error: 'Not authenticated' })
  })

  it('returns error when not client', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'talent-id', role: 'talent' } } as any)
    const formData = new FormData()
    const result = await scheduleInterview('app-id', formData)
    expect(result).toEqual({ error: 'Only clients can schedule interviews' })
  })

  it('returns error when not job poster', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'other-id', role: 'client' } } as any)
    vi.mocked(prisma.application.findUnique).mockResolvedValueOnce({
      ...mockApplication,
      jobPost: { posterId: 'client-id', title: 'Test Job' },
    })
    const formData = new FormData()
    const result = await scheduleInterview('app-id', formData)
    expect(result).toEqual({ error: 'Only the job poster can schedule interviews' })
  })

  it('returns error on missing date', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'client-id', role: 'client' } } as any)
    vi.mocked(prisma.application.findUnique).mockResolvedValueOnce({
      ...mockApplication,
      jobPost: { posterId: 'client-id', title: 'Test Job' },
    })
    const formData = new FormData()
    const result = await scheduleInterview('app-id', formData)
    expect(result).toEqual({ error: 'Interview date and time is required' })
  })

  it('creates interview and updates status', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'client-id', role: 'client' } } as any)
    vi.mocked(prisma.application.findUnique).mockResolvedValueOnce({
      ...mockApplication,
      jobPost: { posterId: 'client-id', title: 'Test Job' },
    })
    vi.mocked(prisma.$transaction).mockResolvedValueOnce([{}, {}])

    const formData = new FormData()
    formData.set('scheduledAt', '2026-06-15T14:00')
    formData.set('duration', '45')
    formData.set('meetingLink', 'https://meet.google.com/abc')

    const result = await scheduleInterview('app-id', formData)

    expect(prisma.$transaction).toHaveBeenCalledWith([
      prisma.application.update({ where: { id: 'app-id' }, data: { status: 'interview' } }),
      prisma.interview.upsert({
        where: { applicationId: 'app-id' },
        create: {
          applicationId: 'app-id',
          scheduledAt: expect.any(Date),
          duration: 45,
          meetingLink: 'https://meet.google.com/abc',
          notes: null,
        },
        update: {
          scheduledAt: expect.any(Date),
          duration: 45,
          meetingLink: 'https://meet.google.com/abc',
          notes: null,
          status: 'scheduled',
        },
      }),
    ])
    expect(result).toEqual({ success: true })
  })
})

describe('cancelInterview', () => {
  it('returns error when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValueOnce(null)
    const result = await cancelInterview('app-id')
    expect(result).toEqual({ error: 'Not authenticated' })
  })

  it('returns error when not job poster', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'other-id' } } as any)
    vi.mocked(prisma.application.findUnique).mockResolvedValueOnce({
      ...mockApplication,
      jobPost: { posterId: 'client-id', title: 'Test Job' },
    })
    const result = await cancelInterview('app-id')
    expect(result).toEqual({ error: 'Only the job poster can cancel interviews' })
  })

  it('cancels interview successfully', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'client-id' } } as any)
    vi.mocked(prisma.application.findUnique).mockResolvedValueOnce({
      ...mockApplication,
      jobPost: { posterId: 'client-id', title: 'Test Job' },
    })
    vi.mocked(prisma.interview.update).mockResolvedValueOnce({} as any)

    const result = await cancelInterview('app-id')

    expect(prisma.interview.update).toHaveBeenCalledWith({
      where: { applicationId: 'app-id' },
      data: { status: 'cancelled' },
    })
    expect(result).toEqual({ success: true })
  })
})

describe('getApplicationById', () => {
  it('returns null when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValueOnce(null)
    const result = await getApplicationById('app-id')
    expect(result).toBeNull()
  })

  it('returns null when application not found', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'talent-id' } } as any)
    vi.mocked(prisma.application.findUnique).mockResolvedValueOnce(null)
    const result = await getApplicationById('app-id')
    expect(result).toBeNull()
  })

  it('returns null when user is not a participant', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'other-id' } } as any)
    vi.mocked(prisma.application.findUnique).mockResolvedValueOnce({
      ...mockApplication,
      jobPost: { posterId: 'client-id', title: 'Test Job' },
      applicant: { id: 'talent-id', name: null, email: 'talent@example.com' },
      conversation: null,
      interview: null,
    })
    const result = await getApplicationById('app-id')
    expect(result).toBeNull()
  })

  it('returns application for the applicant', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'talent-id' } } as any)
    vi.mocked(prisma.application.findUnique).mockResolvedValueOnce({
      ...mockApplication,
      jobPost: { id: 'job-id', title: 'Test Job', posterId: 'client-id', posterName: 'client' },
      applicant: { id: 'talent-id', name: null, email: 'talent@example.com' },
      conversation: null,
      interview: null,
    })

    const result = await getApplicationById('app-id')

    expect(result).not.toBeNull()
    expect(result?.id).toBe('app-id')
    expect(result?.jobPost.title).toBe('Test Job')
  })
})

describe('grantMonthlyConnects', () => {
  let grantMonthlyConnects: typeof import('@/actions/applications').grantMonthlyConnects

  beforeEach(async () => {
    const mod = await import('@/actions/applications')
    grantMonthlyConnects = mod.grantMonthlyConnects
  })

  it('returns error when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValueOnce(null)
    const result = await grantMonthlyConnects()
    expect(result).toEqual({ error: 'Not authenticated' })
  })

  it('returns error when not admin', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'talent-id', role: 'talent' } } as any)
    const result = await grantMonthlyConnects()
    expect(result).toEqual({ error: 'Only admins can trigger monthly grants' })
  })

  it('grants 10 connects to eligible talents', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'admin-id', role: 'admin' } } as any)
    vi.mocked(prisma.user.findMany).mockResolvedValueOnce([
      { id: 'talent-id', role: 'talent' },
      { id: 'talent2-id', role: 'talent' },
    ] as any)
    vi.mocked(prisma.user.update).mockResolvedValue({} as any)

    const result = await grantMonthlyConnects()

    expect(prisma.user.findMany).toHaveBeenCalledWith({
      where: {
        role: 'talent',
        OR: [
          { lastConnectsReset: null },
          { lastConnectsReset: { lte: expect.any(Date) } },
        ],
      },
    })
    expect(prisma.user.update).toHaveBeenCalledTimes(2)
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'talent-id' },
      data: { connects: { increment: 10 }, lastConnectsReset: expect.any(Date) },
    })
    expect(result).toEqual({ success: true, message: 'Granted 10 connects to 2 talent(s)' })
  })
})

describe('addConnects', () => {
  let addConnects: typeof import('@/actions/applications').addConnects

  beforeEach(async () => {
    const mod = await import('@/actions/applications')
    addConnects = mod.addConnects
  })

  it('returns error when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValueOnce(null)
    const result = await addConnects('user-id', 10)
    expect(result).toEqual({ error: 'Not authenticated' })
  })

  it('returns error when not admin', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'talent-id', role: 'talent' } } as any)
    const result = await addConnects('user-id', 10)
    expect(result).toEqual({ error: 'Only admins can add connects' })
  })

  it('returns error for invalid amount', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'admin-id', role: 'admin' } } as any)
    const result = await addConnects('user-id', 0)
    expect(result).toEqual({ error: 'Amount must be at least 1' })
  })

  it('adds connects successfully', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'admin-id', role: 'admin' } } as any)
    vi.mocked(prisma.user.update).mockResolvedValue({} as any)

    const result = await addConnects('talent-id', 10)

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'talent-id' },
      data: { connects: { increment: 10 } },
    })
    expect(result).toEqual({ success: true })
  })
})
