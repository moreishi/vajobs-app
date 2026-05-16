import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    invoice: { findUnique: vi.fn() },
    paymentOrder: { create: vi.fn(), update: vi.fn() },
  },
}))

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

vi.mock('@/lib/constants', () => ({
  ROUTES: {
    ENGAGEMENT_DETAIL: (id: string) => `/dashboard/engagements/${id}`,
  },
}))

vi.mock('@/actions/notifications', () => ({
  createNotification: vi.fn(),
}))

vi.mock('@/lib/payments', () => ({
  getProvider: vi.fn(),
  checkProviderConfigured: vi.fn(),
  PROVIDER_LABELS: { stripe: 'Stripe', paypal: 'PayPal', wise: 'Wise' },
}))

vi.mock('@/lib/payments/types', () => ({
  PROVIDER_NAMES: ['stripe', 'paypal', 'hitpay', 'xendit', 'maya', 'wise'],
}))

const { prisma } = await import('@/lib/prisma')
const { auth } = await import('@/lib/auth')
const { getProvider, checkProviderConfigured } = await import('@/lib/payments')

const mockClient = { user: { id: 'client-1', role: 'client' } }
const mockTalent = { user: { id: 'talent-1', role: 'talent' } }

const mockInvoice = {
  id: 'inv-1',
  contractId: 'contract-1',
  engagementId: 'eng-1',
  amount: 1000,
  currency: 'USD',
  description: 'Milestone payment',
  status: 'pending',
  toId: 'client-1',
  fromId: 'talent-1',
  contract: {
    engagement: {
      clientId: 'client-1',
      talentId: 'talent-1',
    },
  },
}

const mockPaymentOrder = {
  id: 'po-1',
  userId: 'client-1',
  type: 'invoice',
  priceInCents: 100000,
  currency: 'usd',
  provider: 'stripe',
  status: 'pending',
  invoiceId: 'inv-1',
  providerSessionId: null,
}

let createInvoiceCheckoutSession: typeof import('@/actions/invoice-payments').createInvoiceCheckoutSession
let getInvoicePaymentStatus: typeof import('@/actions/invoice-payments').getInvoicePaymentStatus

beforeEach(async () => {
  vi.clearAllMocks()
  const ip = await import('@/actions/invoice-payments')
  createInvoiceCheckoutSession = ip.createInvoiceCheckoutSession
  getInvoicePaymentStatus = ip.getInvoicePaymentStatus
})

describe('createInvoiceCheckoutSession', () => {
  it('returns error when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValueOnce(null)
    const result = await createInvoiceCheckoutSession('inv-1', 'stripe')
    expect(result).toEqual({ error: 'Not authenticated' })
  })

  it('returns error when invoice not found', async () => {
    vi.mocked(auth).mockResolvedValueOnce(mockClient as any)
    vi.mocked(prisma.invoice.findUnique).mockResolvedValueOnce(null)

    const result = await createInvoiceCheckoutSession('inv-1', 'stripe')
    expect(result).toEqual({ error: 'Invoice not found' })
  })

  it('returns error when user is not the recipient', async () => {
    vi.mocked(auth).mockResolvedValueOnce(mockTalent as any)
    vi.mocked(prisma.invoice.findUnique).mockResolvedValueOnce(mockInvoice as any)

    const result = await createInvoiceCheckoutSession('inv-1', 'stripe')
    expect(result).toEqual({ error: 'Only the invoice recipient can make payments' })
  })

  it('returns error when invoice is already paid', async () => {
    vi.mocked(auth).mockResolvedValueOnce(mockClient as any)
    vi.mocked(prisma.invoice.findUnique).mockResolvedValueOnce({ ...mockInvoice, status: 'paid' } as any)

    const result = await createInvoiceCheckoutSession('inv-1', 'stripe')
    expect(result).toEqual({ error: 'Invoice is already paid or pending confirmation' })
  })

  it('returns error when provider not configured', async () => {
    vi.mocked(auth).mockResolvedValueOnce(mockClient as any)
    vi.mocked(prisma.invoice.findUnique).mockResolvedValueOnce(mockInvoice as any)
    vi.mocked(checkProviderConfigured).mockReturnValueOnce(false)

    const result = await createInvoiceCheckoutSession('inv-1', 'stripe')
    expect(result).toEqual({ error: 'stripe is not configured' })
  })

  it('creates payment order and returns redirect URL', async () => {
    vi.mocked(auth).mockResolvedValueOnce(mockClient as any)
    vi.mocked(prisma.invoice.findUnique).mockResolvedValueOnce(mockInvoice as any)
    vi.mocked(checkProviderConfigured).mockReturnValueOnce(true)
    vi.mocked(prisma.paymentOrder.create).mockResolvedValueOnce(mockPaymentOrder as any)
    vi.mocked(prisma.paymentOrder.update).mockResolvedValueOnce(mockPaymentOrder as any)

    const mockProvider = {
      createCheckout: vi.fn().mockResolvedValueOnce({
        redirectUrl: 'https://checkout.stripe.com/session_123',
        sessionId: 'session_123',
      }),
    }
    vi.mocked(getProvider).mockReturnValueOnce(mockProvider as any)

    const result = await createInvoiceCheckoutSession('inv-1', 'stripe')

    expect(prisma.paymentOrder.create).toHaveBeenCalledWith({
      data: {
        userId: 'client-1',
        type: 'invoice',
        priceInCents: 100000,
        currency: 'usd',
        provider: 'stripe',
        description: 'Milestone payment',
        invoiceId: 'inv-1',
        status: 'pending',
      },
    })

    expect(mockProvider.createCheckout).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'invoice',
        invoiceId: 'inv-1',
        orderId: 'po-1',
      }),
    )

    expect(prisma.paymentOrder.update).toHaveBeenCalledWith({
      where: { id: 'po-1' },
      data: { providerSessionId: 'session_123' },
    })

    expect(result).toEqual({ redirectUrl: 'https://checkout.stripe.com/session_123' })
  })

  it('handles provider errors and cleans up payment order', async () => {
    vi.mocked(auth).mockResolvedValueOnce(mockClient as any)
    vi.mocked(prisma.invoice.findUnique).mockResolvedValueOnce(mockInvoice as any)
    vi.mocked(checkProviderConfigured).mockReturnValueOnce(true)
    vi.mocked(prisma.paymentOrder.create).mockResolvedValueOnce(mockPaymentOrder as any)

    const mockProvider = {
      createCheckout: vi.fn().mockRejectedValueOnce(new Error('Stripe API error')),
    }
    vi.mocked(getProvider).mockReturnValueOnce(mockProvider as any)

    const result = await createInvoiceCheckoutSession('inv-1', 'stripe')

    expect(prisma.paymentOrder.update).toHaveBeenCalledWith({
      where: { id: 'po-1' },
      data: { status: 'failed' },
    })
    expect(result).toEqual({ error: 'Stripe API error' })
  })
})

describe('getInvoicePaymentStatus', () => {
  it('returns error when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValueOnce(null)
    const result = await getInvoicePaymentStatus('inv-1')
    expect(result).toEqual({ error: 'Not authenticated' })
  })

  it('returns error when invoice not found', async () => {
    vi.mocked(auth).mockResolvedValueOnce(mockClient as any)
    vi.mocked(prisma.invoice.findUnique).mockResolvedValueOnce(null)

    const result = await getInvoicePaymentStatus('inv-1')
    expect(result).toEqual({ error: 'Invoice not found' })
  })

  it('returns invoice status for recipient', async () => {
    vi.mocked(auth).mockResolvedValueOnce(mockClient as any)
    vi.mocked(prisma.invoice.findUnique).mockResolvedValueOnce(mockInvoice as any)

    const result = await getInvoicePaymentStatus('inv-1')
    expect(result).toEqual({ status: 'pending' })
  })

  it('returns invoice status for sender', async () => {
    vi.mocked(auth).mockResolvedValueOnce(mockTalent as any)
    vi.mocked(prisma.invoice.findUnique).mockResolvedValueOnce(mockInvoice as any)

    const result = await getInvoicePaymentStatus('inv-1')
    expect(result).toEqual({ status: 'pending' })
  })

  it('returns error for non-participant', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: 'stranger' } } as any)
    vi.mocked(prisma.invoice.findUnique).mockResolvedValueOnce(mockInvoice as any)

    const result = await getInvoicePaymentStatus('inv-1')
    expect(result).toEqual({ error: 'Not authorized' })
  })
})
