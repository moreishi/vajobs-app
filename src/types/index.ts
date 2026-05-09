import 'next-auth'
import 'next-auth/jwt'

export type Role = 'guest' | 'talent' | 'client' | 'admin'

export type JobStatus = 'draft' | 'open' | 'closed'

export type JobType = 'full-time' | 'part-time' | 'contract' | 'freelance' | 'internship'

export type JobPost = {
  id: string
  title: string
  description: string
  short_description: string | null
  location: string | null
  type: JobType
  salary_range: string | null
  skills: string[]
  status: JobStatus
  poster_id: string
  poster_name: string | null
  created_at: string
  updated_at: string
}

export type ApplicationStatus =
  | 'pending'
  | 'reviewed'
  | 'interview'
  | 'accepted'
  | 'rejected'
  | 'withdrawn'

export type InterviewStatus = 'scheduled' | 'completed' | 'cancelled'

export type Application = {
  id: string
  jobPostId: string
  applicantId: string
  coverLetter: string | null
  status: ApplicationStatus
  biddingConnects: number
  createdAt: string
  updatedAt: string
  jobPost?: {
    id: string
    title: string
    posterId: string
    posterName: string | null
  }
  applicant?: {
    id: string
    name: string | null
    email: string
  }
  conversation?: Conversation | null
  interview?: Interview | null
}

export type Conversation = {
  id: string
  applicationId: string
  createdAt: string
  updatedAt: string
  messages?: Message[]
}

export type Message = {
  id: string
  conversationId: string
  senderId: string
  content: string
  attachmentUrl: string | null
  attachmentName: string | null
  createdAt: string
  sender?: {
    id: string
    name: string | null
    email: string
  }
}

export type Interview = {
  id: string
  applicationId: string
  scheduledAt: string
  duration: number | null
  meetingLink: string | null
  notes: string | null
  status: InterviewStatus
  createdAt: string
  updatedAt: string
}

export type Availability = 'available' | 'busy' | 'unavailable'

export type Profile = {
  id: string
  userId: string
  headline: string | null
  bio: string | null
  skills: string[]
  hourlyRate: number | null
  experience: number | null
  availability: Availability
  isPublic: boolean
  resumeUrl: string | null
  createdAt: string
  updatedAt: string
  user?: {
    id: string
    name: string | null
    email: string
    image: string | null
  }
}

export type Review = {
  id: string
  applicationId: string
  reviewerId: string
  revieweeId: string
  rating: number
  comment: string | null
  createdAt: string
  reviewer?: {
    id: string
    name: string | null
    email: string
    image: string | null
  }
}

export type EngagementStatus = 'active' | 'ended'

export type Engagement = {
  id: string
  applicationId: string
  talentId: string
  clientId: string
  jobPostId: string
  status: EngagementStatus
  startDate: string
  rate: number | null
  endDate: string | null
  createdAt: string
  updatedAt: string
  talent?: { id: string; name: string | null; email: string }
  client?: { id: string; name: string | null; email: string }
  jobPost?: { id: string; title: string }
  application?: { id: string; coverLetter: string | null }
}

export type ClientProfile = {
  id: string
  userId: string
  company: string | null
  title: string | null
  bio: string | null
  user?: {
    id: string
    name: string | null
    email: string
    image: string | null
  }
  jobCount?: number
}

declare module 'next-auth' {
  interface User {
    role?: string
  }
  interface Session {
    user: {
      id?: string
      role?: string
    } & import('next-auth').DefaultSession['user']
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string
    role?: string
  }
}
