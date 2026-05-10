import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    jobPost: { findUnique: vi.fn() },
    skillAssessment: { create: vi.fn(), findUnique: vi.fn(), update: vi.fn(), delete: vi.fn(), findMany: vi.fn() },
    assessmentAttempt: { create: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
    application: { findUnique: vi.fn() },
  },
}))

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

const mockClient = { user: { id: 'client-1', role: 'client' } }
const mockAdmin = { user: { id: 'admin-1', role: 'admin' } }
const mockTalent = { user: { id: 'talent-1', role: 'talent' } }
const mockJob = { id: 'job-1', posterId: 'client-1' }

beforeEach(() => {
  vi.clearAllMocks()
})

describe('createAssessment', () => {
  const validData = {
    jobPostId: 'job-1',
    title: 'React Fundamentals',
    description: 'Test your React knowledge',
    questions: [{ id: 'q1', question: 'What is JSX?' }],
    passScore: 70,
  }

  it('returns error when not authenticated', async () => {
    const { createAssessment } = await import('@/actions/assessments')
    vi.mocked(auth).mockResolvedValueOnce(null)
    const result = await createAssessment(validData)
    expect(result).toEqual({ error: 'Not authenticated' })
  })

  it('returns error when not a client or admin', async () => {
    const { createAssessment } = await import('@/actions/assessments')
    vi.mocked(auth).mockResolvedValueOnce(mockTalent as any)
    const result = await createAssessment(validData)
    expect(result).toEqual({ error: 'Only clients can create assessments' })
  })

  it('returns error when job not found', async () => {
    const { createAssessment } = await import('@/actions/assessments')
    vi.mocked(auth).mockResolvedValueOnce(mockClient as any)
    vi.mocked(prisma.jobPost.findUnique).mockResolvedValueOnce(null)
    const result = await createAssessment(validData)
    expect(result).toEqual({ error: 'Job not found' })
  })

  it('returns error when not authorized for job', async () => {
    const { createAssessment } = await import('@/actions/assessments')
    vi.mocked(auth).mockResolvedValueOnce(mockClient as any)
    vi.mocked(prisma.jobPost.findUnique).mockResolvedValueOnce({ id: 'job-1', posterId: 'other-client' } as any)
    const result = await createAssessment(validData)
    expect(result).toEqual({ error: 'Not authorized' })
  })

  it('creates assessment successfully', async () => {
    const { createAssessment } = await import('@/actions/assessments')
    vi.mocked(auth).mockResolvedValueOnce(mockClient as any)
    vi.mocked(prisma.jobPost.findUnique).mockResolvedValueOnce(mockJob as any)

    const result = await createAssessment(validData)

    expect(prisma.skillAssessment.create).toHaveBeenCalledWith({
      data: {
        jobPostId: 'job-1',
        clientId: 'client-1',
        title: 'React Fundamentals',
        description: 'Test your React knowledge',
        questions: JSON.stringify(validData.questions),
        passScore: 70,
        timeLimit: null,
      },
    })
    expect(result).toEqual({ success: true })
  })

  it('allows admin to create assessment for any job', async () => {
    const { createAssessment } = await import('@/actions/assessments')
    vi.mocked(auth).mockResolvedValueOnce(mockAdmin as any)
    vi.mocked(prisma.jobPost.findUnique).mockResolvedValueOnce({ id: 'job-1', posterId: 'client-1' } as any)

    const result = await createAssessment(validData)
    expect(result).toEqual({ success: true })
  })
})

describe('submitAssessment', () => {
  const mockAssessment = { id: 'assess-1' }
  const mockApplication = { id: 'app-1', applicantId: 'talent-1' }
  const answers = [{ questionId: 'q1', answer: 'JSX is syntax sugar for React.createElement' }]

  it('returns error when not authenticated', async () => {
    const { submitAssessment } = await import('@/actions/assessments')
    vi.mocked(auth).mockResolvedValueOnce(null)
    const result = await submitAssessment('assess-1', 'app-1', answers)
    expect(result).toEqual({ error: 'Not authenticated' })
  })

  it('returns error when not a talent', async () => {
    const { submitAssessment } = await import('@/actions/assessments')
    vi.mocked(auth).mockResolvedValueOnce(mockClient as any)
    const result = await submitAssessment('assess-1', 'app-1', answers)
    expect(result).toEqual({ error: 'Only talents can submit assessments' })
  })

  it('returns error when assessment not found', async () => {
    const { submitAssessment } = await import('@/actions/assessments')
    vi.mocked(auth).mockResolvedValueOnce(mockTalent as any)
    vi.mocked(prisma.skillAssessment.findUnique).mockResolvedValueOnce(null)
    const result = await submitAssessment('assess-1', 'app-1', answers)
    expect(result).toEqual({ error: 'Assessment not found' })
  })

  it('returns error when application not found', async () => {
    const { submitAssessment } = await import('@/actions/assessments')
    vi.mocked(auth).mockResolvedValueOnce(mockTalent as any)
    vi.mocked(prisma.skillAssessment.findUnique).mockResolvedValueOnce(mockAssessment as any)
    vi.mocked(prisma.application.findUnique).mockResolvedValueOnce(null)
    const result = await submitAssessment('assess-1', 'app-1', answers)
    expect(result).toEqual({ error: 'Application not found' })
  })

  it('returns error when application belongs to another user', async () => {
    const { submitAssessment } = await import('@/actions/assessments')
    vi.mocked(auth).mockResolvedValueOnce(mockTalent as any)
    vi.mocked(prisma.skillAssessment.findUnique).mockResolvedValueOnce(mockAssessment as any)
    vi.mocked(prisma.application.findUnique).mockResolvedValueOnce({ id: 'app-1', applicantId: 'other-user' } as any)
    const result = await submitAssessment('assess-1', 'app-1', answers)
    expect(result).toEqual({ error: 'Not authorized' })
  })

  it('returns error when already submitted', async () => {
    const { submitAssessment } = await import('@/actions/assessments')
    vi.mocked(auth).mockResolvedValueOnce(mockTalent as any)
    vi.mocked(prisma.skillAssessment.findUnique).mockResolvedValueOnce(mockAssessment as any)
    vi.mocked(prisma.application.findUnique).mockResolvedValueOnce(mockApplication as any)
    vi.mocked(prisma.assessmentAttempt.findUnique).mockResolvedValueOnce({ id: 'attempt-1' } as any)
    const result = await submitAssessment('assess-1', 'app-1', answers)
    expect(result).toEqual({ error: 'You have already submitted this assessment' })
  })

  it('submits successfully', async () => {
    const { submitAssessment } = await import('@/actions/assessments')
    vi.mocked(auth).mockResolvedValueOnce(mockTalent as any)
    vi.mocked(prisma.skillAssessment.findUnique).mockResolvedValueOnce(mockAssessment as any)
    vi.mocked(prisma.application.findUnique).mockResolvedValueOnce(mockApplication as any)
    vi.mocked(prisma.assessmentAttempt.findUnique).mockResolvedValueOnce(null)

    const result = await submitAssessment('assess-1', 'app-1', answers)

    expect(prisma.assessmentAttempt.create).toHaveBeenCalledWith({
      data: {
        assessmentId: 'assess-1',
        applicantId: 'talent-1',
        applicationId: 'app-1',
        answers: JSON.stringify(answers),
        completedAt: expect.any(Date),
      },
    })
    expect(result).toEqual({ success: true })
  })
})

describe('gradeAssessment', () => {
  const mockAttempt = {
    id: 'attempt-1',
    assessment: { clientId: 'client-1', title: 'Test' },
    application: { jobPost: { posterId: 'client-1' } },
  }

  it('returns error when not authenticated', async () => {
    const { gradeAssessment } = await import('@/actions/assessments')
    vi.mocked(auth).mockResolvedValueOnce(null)
    const result = await gradeAssessment('attempt-1', 80, true)
    expect(result).toEqual({ error: 'Not authenticated' })
  })

  it('returns error when attempt not found', async () => {
    const { gradeAssessment } = await import('@/actions/assessments')
    vi.mocked(auth).mockResolvedValueOnce(mockClient as any)
    vi.mocked(prisma.assessmentAttempt.findUnique).mockResolvedValueOnce(null)
    const result = await gradeAssessment('attempt-1', 80, true)
    expect(result).toEqual({ error: 'Attempt not found' })
  })

  it('returns error when score out of range', async () => {
    const { gradeAssessment } = await import('@/actions/assessments')
    vi.mocked(auth).mockResolvedValueOnce(mockClient as any)
    vi.mocked(prisma.assessmentAttempt.findUnique).mockResolvedValueOnce(mockAttempt as any)
    const result = await gradeAssessment('attempt-1', 101, true)
    expect(result).toEqual({ error: 'Score must be between 0 and 100' })
  })

  it('grades successfully as poster', async () => {
    const { gradeAssessment } = await import('@/actions/assessments')
    vi.mocked(auth).mockResolvedValueOnce(mockClient as any)
    vi.mocked(prisma.assessmentAttempt.findUnique).mockResolvedValueOnce(mockAttempt as any)
    const result = await gradeAssessment('attempt-1', 85, true)
    expect(prisma.assessmentAttempt.update).toHaveBeenCalledWith({
      where: { id: 'attempt-1' },
      data: { score: 85, passed: true },
    })
    expect(result).toEqual({ success: true })
  })

  it('grades successfully as admin', async () => {
    const { gradeAssessment } = await import('@/actions/assessments')
    vi.mocked(auth).mockResolvedValueOnce(mockAdmin as any)
    vi.mocked(prisma.assessmentAttempt.findUnique).mockResolvedValueOnce(mockAttempt as any)
    const result = await gradeAssessment('attempt-1', 70, true)
    expect(result).toEqual({ success: true })
  })
})

describe('getAssessmentAttempt', () => {
  const now = new Date()

  it('returns null when not authenticated', async () => {
    const { getAssessmentAttempt } = await import('@/actions/assessments')
    vi.mocked(auth).mockResolvedValueOnce(null)
    const result = await getAssessmentAttempt('app-1')
    expect(result).toBeNull()
  })

  it('returns null when no attempt exists', async () => {
    const { getAssessmentAttempt } = await import('@/actions/assessments')
    vi.mocked(auth).mockResolvedValueOnce(mockTalent as any)
    vi.mocked(prisma.assessmentAttempt.findUnique).mockResolvedValueOnce(null)
    const result = await getAssessmentAttempt('app-1')
    expect(result).toBeNull()
  })

  it('returns attempt for the applicant', async () => {
    const { getAssessmentAttempt } = await import('@/actions/assessments')
    vi.mocked(auth).mockResolvedValueOnce(mockTalent as any)
    vi.mocked(prisma.assessmentAttempt.findUnique).mockResolvedValueOnce({
      id: 'attempt-1',
      assessmentId: 'assess-1',
      applicantId: 'talent-1',
      applicationId: 'app-1',
      answers: JSON.stringify([{ questionId: 'q1', answer: 'JSX is syntax sugar' }]),
      score: 85,
      passed: true,
      startedAt: now,
      completedAt: now,
      assessment: { id: 'assess-1', title: 'Test', questions: JSON.stringify([{ id: 'q1', question: 'What is JSX?' }]), passScore: 70 },
      application: { jobPost: { posterId: 'client-1' } },
    } as any)

    const result = await getAssessmentAttempt('app-1')

    expect(result).not.toBeNull()
    expect(result?.answers).toEqual([{ questionId: 'q1', answer: 'JSX is syntax sugar' }])
    expect(result?.assessment.questions).toEqual([{ id: 'q1', question: 'What is JSX?' }])
    expect(result?.score).toBe(85)
    expect(result?.passed).toBe(true)
  })

  it('returns null for unauthorized user', async () => {
    const { getAssessmentAttempt } = await import('@/actions/assessments')
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'stranger', role: 'talent' } } as any)
    vi.mocked(prisma.assessmentAttempt.findUnique).mockResolvedValueOnce({
      id: 'attempt-1',
      applicantId: 'talent-1',
      application: { jobPost: { posterId: 'client-1' } },
    } as any)

    const result = await getAssessmentAttempt('app-1')
    expect(result).toBeNull()
  })
})
