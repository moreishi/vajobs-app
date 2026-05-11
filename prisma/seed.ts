import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

interface RateTier {
  beginner: string
  experienced: string
  advanced: string
}

interface JobBlueprint {
  baseTitle: string
  description: string
  shortDescription: string
  skills: string[]
  rates: RateTier
}

const CLIENTS = [
  { name: 'GrowthAssistant Inc.', email: 'hr@growthassistant.io' },
  { name: 'Remote Workforce PH', email: 'jobs@remoteworkforce.ph' },
  { name: 'VA Talent Co.', email: 'talent@vatalent.co' },
]

const JOB_BLUEPRINTS: JobBlueprint[] = [
  {
    baseTitle: 'Executive Operations Assistant',
    description:
      "Come be the right hand our founders and leadership teams rely on. We're looking for a proactive Filipino Executive Assistant who wants to grow alongside ambitious businesses — not just take tasks, but truly partner with executives to make their days run smoothly.\n\nYou'll work closely with decision-makers, learn how businesses operate from the inside, and have real ownership over the systems that keep everything moving.\n\nHere's how we'll work together:\n- Own the calendar and inbox — prioritize what matters, filter the noise\n- Coordinate meetings and appointments across time zones\n- Collaborate on research, reporting, and project follow-ups\n- Build and refine SOPs that make the whole team more efficient\n- Be the go-to person who anticipates needs before they arise\n\nWhat you'll bring:\n- Clear, confident English communication\n- Google Workspace or Microsoft Office fluency\n- Experience with Notion, ClickUp, or Asana\n- A sharp eye for detail and a self-starter attitude\n\nLong-term growth and leadership opportunities for reliable partners.",
    shortDescription:
      'Partner with founders and leadership teams as their right hand — own calendars, systems, and operations that keep businesses running.',
    skills: ['Google Workspace', 'Microsoft Office', 'Notion', 'ClickUp', 'Asana', 'Calendar Management'],
    rates: { beginner: '$6–8/hr', experienced: '$10–18/hr', advanced: '$20–30/hr' },
  },
  {
    baseTitle: 'Customer Support Specialist',
    description:
      "Join a team that puts people first. We're looking for a Filipino Customer Support VA who genuinely enjoys helping others and wants to be the voice of growing brands.\n\nYou won't just answer tickets — you'll build relationships with customers, solve real problems, and collaborate with product and operations teams to make every interaction better than the last.\n\nHere's how we'll work together:\n- Handle email and live chat with warmth and efficiency\n- Own the ticket queue — triage, resolve, and follow up\n- Manage refunds and inquiries with empathy and good judgment\n- Keep CRM records clean and meaningful\n- Share customer insights with the team so we continuously improve\n\nWhat you'll bring:\n- Strong written English that puts people at ease\n- A problem-solving mindset — you find answers, not excuses\n- Experience with Zendesk, Gorgias, or Intercom\n- Calm, professional communication even under pressure\n\nPerformance-based growth and specialization tracks available.",
    shortDescription:
      'Be the voice of growing brands — solve problems, build relationships, and shape how customers experience products every day.',
    skills: ['Zendesk', 'Gorgias', 'Intercom', 'CRM', 'Live Chat', 'Email Support'],
    rates: { beginner: '$6–8/hr', experienced: '$10–15/hr', advanced: '$18–25/hr' },
  },
  {
    baseTitle: 'Social Media Manager',
    description:
      "Want to help build brands that people actually talk about? We're looking for a creative Filipino Social Media Manager to partner with brands, agencies, and content creators who are serious about growing their audience.\n\nThis isn't just scheduling posts — you'll shape brand voices, spark conversations, and work shoulder-to-shoulder with marketing teams to turn followers into communities.\n\nHere's how we'll work together:\n- Plan and schedule content that stops the scroll\n- Write captions that sound like the brand — not a robot\n- Engage with communities authentically and consistently\n- Design eye-catching visuals in Canva\n- Track what works and bring data-backed ideas to the table\n- Keep a pulse on trends so our brands stay ahead\n\nWhat you'll bring:\n- Canva skills and a good eye for design\n- Meta Business Suite experience\n- Active familiarity with Instagram, TikTok, LinkedIn, Facebook\n- A sense of what makes content shareable\n\nPortfolio-based applicants move to the front of the line.",
    shortDescription:
      'Shape brand voices and build real communities — partner with marketing teams to create content that connects and grows.',
    skills: ['Canva', 'Meta Business Suite', 'Instagram', 'TikTok', 'LinkedIn', 'Content Strategy'],
    rates: { beginner: '$7–10/hr', experienced: '$15–25/hr', advanced: '$30–60/hr' },
  },
  {
    baseTitle: 'Short-Form Video Editor',
    description:
      "If you love creating content that stops the scroll, we want to collaborate with you. We're looking for a Filipino Video Editor who understands what makes people watch, laugh, and share.\n\nYou'll work directly with content creators and marketing teams, turning raw footage into videos that captivate. Your edits won't just be seen — they'll drive growth.\n\nHere's how we'll work together:\n- Cut short-form content for TikTok, Reels, and YouTube Shorts\n- Add captions and subtitles that keep viewers hooked\n- Repurpose long-form content into snackable clips\n- Optimize hooks and pacing for each platform's audience\n- Add motion graphics that elevate the story\n\nWhat you'll bring:\n- CapCut, Premiere Pro, or DaVinci Resolve skills\n- An instinct for what makes content go viral\n- A collaborative mindset — we brainstorm together\n\nYour portfolio is your resume here.",
    shortDescription:
      'Partner with creators and brands to craft scroll-stopping videos — your edits will drive real growth across TikTok, Reels, and Shorts.',
    skills: ['CapCut', 'Premiere Pro', 'DaVinci Resolve', 'Motion Graphics', 'Video Editing'],
    rates: { beginner: '$8–12/hr', experienced: '$18–35/hr', advanced: '$40–80/hr' },
  },
  {
    baseTitle: 'Graphic Designer',
    description:
      "Love bringing visual ideas to life? We're looking for a talented Filipino Graphic Designer to collaborate with brands, marketing teams, and content creators who value great design.\n\nYou won't just push pixels — you'll shape how brands look and feel, working alongside strategists and marketers who will champion your work.\n\nHere's how we'll work together:\n- Design social media graphics that stop the feed\n- Create ad creatives that convert\n- Build branding materials that tell a story\n- Design presentations that wow stakeholders\n- Produce marketing assets across campaigns\n\nWhat you'll bring:\n- Canva fluency and Adobe Photoshop skills\n- Illustrator or Figma experience\n- Understanding of branding fundamentals\n- A portfolio that shows your range\n\nWe invest in designers who show initiative and taste.",
    shortDescription:
      'Shape how brands look and feel — collaborate with marketers and strategists to create visuals that connect and convert.',
    skills: ['Canva', 'Adobe Photoshop', 'Illustrator', 'Figma', 'Branding'],
    rates: { beginner: '$8–12/hr', experienced: '$18–30/hr', advanced: '$35–70/hr' },
  },
  {
    baseTitle: 'E-Commerce Operations Assistant',
    description:
      "Ready to help brands thrive in the fast-paced world of e-commerce? We're looking for a Filipino E-commerce VA to partner with online stores and growing brands.\n\nYou'll be at the center of operations — collaborating with suppliers, marketing teams, and customers to make sure everything runs like clockwork.\n\nHere's how we'll work together:\n- List and optimize products so they actually sell\n- Track inventory and coordinate with suppliers\n- Manage orders and fulfillment end-to-end\n- Support customers with a helpful, human touch\n- Maintain Shopify stores and keep them fresh\n\nWhat you'll bring:\n- Shopify experience (Amazon Seller Central or WooCommerce a plus)\n- Meticulous attention to detail\n- Resourcefulness — you solve problems before they escalate\n\nLong-term collaboration for the right operator.",
    shortDescription:
      'Partner with online brands to run their stores — from product listings to fulfillment, you keep e-commerce businesses moving.',
    skills: ['Shopify', 'Amazon Seller Central', 'WooCommerce', 'Inventory Management', 'Order Fulfillment'],
    rates: { beginner: '$8–12/hr', experienced: '$15–25/hr', advanced: '$30–50/hr' },
  },
  {
    baseTitle: 'Bookkeeper / Finance VA',
    description:
      "If you love the numbers side of business and want to be a trusted partner to growing companies, this is for you. We're looking for a detail-oriented Filipino Bookkeeping VA who takes pride in accurate, organized financial work.\n\nYou'll work directly with business owners and finance leads — not just entering data, but helping them understand their financial story.\n\nHere's how we'll work together:\n- Manage invoices and keep payment records spotless\n- Track expenses and categorize transactions\n- Reconcile accounts so everything balances\n- Prepare financial reports that actually get used\n- Support payroll and help everyone get paid on time\n\nWhat you'll bring:\n- Xero or QuickBooks experience\n- Solid accounting fundamentals\n- Discretion and a commitment to confidentiality\n\nBookkeeping certifications are a strong plus — we'll support your growth.",
    shortDescription:
      'Be the trusted financial partner businesses depend on — manage books, invoices, and reports that keep companies healthy.',
    skills: ['Xero', 'QuickBooks', 'Accounting', 'Payroll', 'Reconciliation'],
    rates: { beginner: '$10–15/hr', experienced: '$18–35/hr', advanced: '$40–70/hr' },
  },
  {
    baseTitle: 'Lead Generation & Outreach Specialist',
    description:
      "Want to be the person who opens doors for growing businesses? We're looking for a Filipino Lead Generation VA to partner with sales teams and help them connect with the right people.\n\nYou'll research, organize, and reach out — working alongside business owners who will value your contribution to their growth.\n\nHere's how we'll work together:\n- Research prospects and build targeted lists\n- Keep CRM data clean, organized, and actionable\n- Craft and send cold outreach that actually gets replies\n- Organize lead data so the team can act fast\n- Set appointments and keep the pipeline warm\n\nWhat you'll bring:\n- LinkedIn Sales Navigator, Apollo, or HubSpot experience\n- Strong written communication\n- Persistence paired with professionalism\n\nResults-driven approach pays off — top performers earn bonuses.",
    shortDescription:
      'Open doors for growing businesses — partner with sales teams to find, organize, and connect with the right prospects.',
    skills: ['LinkedIn Sales Navigator', 'Apollo', 'HubSpot', 'CRM', 'Cold Outreach', 'Appointment Setting'],
    rates: { beginner: '$7–12/hr', experienced: '$15–30/hr', advanced: '$40+/hr' },
  },
  {
    baseTitle: 'SEO Specialist',
    description:
      "If you understand that great SEO is about helping people find what they're looking for, let's talk. We're looking for a Filipino SEO Specialist to partner with content and marketing teams who are building for the long term.\n\nYou'll own the strategy behind the rankings — collaborating with writers, developers, and strategists to grow organic traffic that lasts.\n\nHere's how we'll work together:\n- Research keywords that real people are searching for\n- Optimize pages so search engines (and humans) love them\n- Track rankings and report on what's working\n- Work with content teams to shape SEO-friendly articles\n- Handle technical SEO — meta tags, structure, site speed\n\nWhat you'll bring:\n- Ahrefs, SEMrush, or SurferSEO experience\n- WordPress familiarity\n- A strategic mindset — you think beyond just keywords\n\nCase studies and portfolios preferred. Let's grow together.",
    shortDescription:
      'Own the strategy behind the rankings — collaborate with content and marketing teams to grow organic traffic that lasts.',
    skills: ['Ahrefs', 'SEMrush', 'SurferSEO', 'WordPress', 'Technical SEO', 'Keyword Research'],
    rates: { beginner: '$10–18/hr', experienced: '$25–45/hr', advanced: '$60–120/hr' },
  },
  {
    baseTitle: 'Content Writer & Copywriter',
    description:
      "If words are your superpower, we'd love to collaborate. We're looking for a Filipino Content Writer & Copywriter who can craft copy that connects, converts, and builds brands.\n\nYou'll work alongside marketing teams, SEO strategists, and brand leads — your writing won't just fill pages, it'll drive results.\n\nHere's how we'll work together:\n- Write blog posts and SEO articles that actually get read\n- Craft website copy that speaks to the right audience\n- Create email campaigns people look forward to opening\n- Research topics thoroughly so every piece has depth\n- Adapt tone and voice across different brands and industries\n\nWhat you'll bring:\n- Strong English writing that flows naturally\n- SEO knowledge (you know keywords are a tool, not the goal)\n- Comfort with AI-assisted workflows — the future is hybrid\n- A sharp ear for tone, clarity, and persuasion\n\nWriting samples required. Show us what you can do.",
    shortDescription:
      'Craft copy that connects and converts — collaborate with marketing teams to write content that builds brands and drives results.',
    skills: ['SEO Writing', 'Copywriting', 'Blog Writing', 'Email Marketing', 'Content Research'],
    rates: { beginner: '$8–15/hr', experienced: '$20–40/hr', advanced: '$50–150/hr' },
  },
  {
    baseTitle: 'AI Automation & Workflow Specialist',
    description:
      "This is one of the fastest-growing skillsets globally, and we want you at the forefront. We're looking for a Filipino AI Automation VA to partner with businesses in designing smarter ways to work.\n\nYou won't just set up tools — you'll reimagine workflows, eliminate busywork, and help teams focus on what actually matters.\n\nHere's how we'll work together:\n- Design ChatGPT-powered workflows that save hours daily\n- Build automations in Zapier, Make, or n8n\n- Create SOPs that document and scale your systems\n- Automate CRM workflows so nothing falls through the cracks\n- Analyze processes and find new opportunities for optimization\n\nWhat you'll bring:\n- Hands-on experience with ChatGPT and prompt engineering\n- Zapier, Make, or n8n skills\n- A systems-thinking mindset — you see the big picture\n\nAutomation portfolios earn top consideration. This role has the highest earning potential on our platform.",
    shortDescription:
      'Reimagine how businesses work — design AI-powered automations and workflows that save teams hours every single day.',
    skills: ['ChatGPT', 'Zapier', 'Make', 'n8n', 'AI Prompting', 'Automation'],
    rates: { beginner: '$15–25/hr', experienced: '$35–70/hr', advanced: '$80–200/hr' },
  },
  {
    baseTitle: 'Real Estate Operations Assistant',
    description:
      "Help real estate professionals in the US and Australia do what they do best — serve clients and close deals. We're looking for a Filipino Real Estate VA to partner with agents and agencies who need reliable operational support.\n\nYou'll be the backbone of their daily operations, collaborating closely with agents who will genuinely appreciate your help.\n\nHere's how we'll work together:\n- Manage CRM systems and keep client data organized\n- Coordinate property listings across platforms\n- Schedule appointments and showings\n- Follow up with leads so nothing goes cold\n- Handle administrative tasks that keep the office running\n\nWhat you'll bring:\n- GoHighLevel, Podio, or Follow Up Boss experience\n- Strong organizational skills\n- A proactive, can-do approach\n\nReal estate experience is a bonus but not required — we'll train the right person.",
    shortDescription:
      'Be the operational backbone real estate agents rely on — manage listings, leads, and schedules that keep their business moving.',
    skills: ['GoHighLevel', 'Podio', 'Follow Up Boss', 'CRM', 'Real Estate'],
    rates: { beginner: '$8–12/hr', experienced: '$15–25/hr', advanced: '$30–50/hr' },
  },
  {
    baseTitle: 'Email Marketing Specialist',
    description:
      "Want to help brands stay connected with the people who matter most? We're looking for a Filipino Email Marketing Specialist to partner with brands and build campaigns that build relationships.\n\nYou'll work alongside marketing teams to craft emails that people actually want to open — not just send, but truly connect.\n\nHere's how we'll work together:\n- Design newsletters that inform, engage, and convert\n- Build automation sequences that nurture leads over time\n- Segment lists so the right message reaches the right person\n- Track campaign performance and iterate based on data\n- Create lead nurturing workflows that turn subscribers into customers\n\nWhat you'll bring:\n- Klaviyo, Mailchimp, or ActiveCampaign skills\n- Copywriting fundamentals — subject lines matter\n- Analytical thinking — you learn from every send\n\nCampaign samples will make your application stand out.",
    shortDescription:
      'Build campaigns that build relationships — partner with brands to craft emails people actually want to open and act on.',
    skills: ['Klaviyo', 'Mailchimp', 'ActiveCampaign', 'Email Marketing', 'Copywriting', 'Automation'],
    rates: { beginner: '$12–20/hr', experienced: '$25–45/hr', advanced: '$60–120/hr' },
  },
  {
    baseTitle: 'Remote Project Manager / Operations Coordinator',
    description:
      "Do you love bringing order to chaos and helping teams do their best work? We're looking for a Filipino Project Management VA to partner with businesses that need someone to keep everything on track.\n\nYou'll be the connective tissue between teams, clients, and stakeholders — making sure communication flows, deadlines are met, and everyone has what they need to succeed.\n\nHere's how we'll work together:\n- Coordinate projects and keep teams aligned on priorities\n- Drive follow-ups so nothing falls through the cracks\n- Manage deadlines and help the team stay ahead\n- Build and refine workflows that scale with the business\n- Create and maintain SOPs that make collaboration seamless\n\nWhat you'll bring:\n- ClickUp, Monday.com, Trello, or Notion expertise\n- Real leadership and communication skills\n- An operations mindset — you love making things better\n\nOperations-minded applicants who think ahead will thrive here.",
    shortDescription:
      'Be the connective tissue that keeps teams aligned — coordinate projects, drive follow-ups, and build workflows that scale.',
    skills: ['ClickUp', 'Monday.com', 'Trello', 'Notion', 'Project Management', 'SOP'],
    rates: { beginner: '$12–20/hr', experienced: '$30–50/hr', advanced: '$60–120/hr' },
  },
  {
    baseTitle: 'CRM & Business Operations Specialist',
    description:
      "If you see business operations as a puzzle you want to solve, we'd love to collaborate. We're looking for a Filipino CRM & Operations VA to partner with companies that care about systems, pipelines, and efficiency.\n\nYou'll work alongside leadership teams — not just managing tools, but designing the operational systems that make businesses run better.\n\nHere's how we'll work together:\n- Own CRM platforms and keep pipelines organized and healthy\n- Build automations that reduce manual work\n- Manage client follow-ups so relationships stay strong\n- Document processes so the whole team stays aligned\n- Continuously improve how things work\n\nWhat you'll bring:\n- HubSpot, GoHighLevel, Salesforce, or Pipedrive experience\n- A process optimization mindset — you see what can be better\n- Proactive thinking — you don't wait to be asked\n\nBusiness-savvy applicants who think in systems are highly valued here.",
    shortDescription:
      'Design the operational systems that make businesses run better — partner with leadership to optimize pipelines, automations, and processes.',
    skills: ['HubSpot', 'GoHighLevel', 'Salesforce', 'Pipedrive', 'CRM', 'Automation'],
    rates: { beginner: '$10–18/hr', experienced: '$25–40/hr', advanced: '$50–100/hr' },
  },
]

/** Each category produces 2 job posts: Experienced (uses beginner rate), Advanced (uses experienced rate) */
interface GeneratedJob {
  title: string
  shortDescription: string
  salaryRange: string
  skills: string[]
  posterIndex: number
}

function generateJobs(): GeneratedJob[] {
  const jobs: GeneratedJob[] = []
  for (let i = 0; i < JOB_BLUEPRINTS.length; i++) {
    const bp = JOB_BLUEPRINTS[i]

    jobs.push({
      title: `Experienced ${bp.baseTitle}`,
      shortDescription: `[Experienced] ${bp.shortDescription}`,
      salaryRange: bp.rates.beginner,
      skills: bp.skills,
      posterIndex: 2,
    })

    jobs.push({
      title: `Advanced ${bp.baseTitle}`,
      shortDescription: `[Advanced] ${bp.shortDescription}`,
      salaryRange: bp.rates.experienced,
      skills: bp.skills,
      posterIndex: 2,
    })
  }
  return jobs
}

async function main() {
  console.log('Seeding database ...\n')

  // Delete in dependency order
  await prisma.vaSubscription.deleteMany()
  await prisma.vaSubscriptionPlan.deleteMany()
  await prisma.clientSubscription.deleteMany()
  await prisma.subscriptionPlan.deleteMany()
  await prisma.message.deleteMany()
  await prisma.conversation.deleteMany()
  await prisma.interview.deleteMany()
  await prisma.review.deleteMany()
  await prisma.engagement.deleteMany()
  await prisma.application.deleteMany()
  await prisma.savedJob.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.connectTransaction.deleteMany()
  await prisma.jobPost.deleteMany()
  await prisma.profile.deleteMany()
  await prisma.clientProfile.deleteMany()
  await prisma.session.deleteMany()
  await prisma.account.deleteMany()
  await prisma.verificationToken.deleteMany()
  await prisma.user.deleteMany()

  console.log('  Cleared existing data')

  const pw = await hash('password', 12)
  const now = new Date()

  const admin = await prisma.user.create({
    data: {
      email: 'admin@vajobs.online',
      password: pw,
      role: 'admin',
      name: 'Admin',
      emailVerified: now,
      connects: 9999,
    },
  })
  console.log(`  Created admin: admin@vajobs.online / password`)

  const clientRecords: { id: string; name: string }[] = []
  for (const c of CLIENTS) {
    const record = await prisma.user.create({
      data: {
        email: c.email,
        password: pw,
        role: 'client',
        name: c.name,
        emailVerified: now,
        connects: 9999,
      },
    })
    clientRecords.push({ id: record.id, name: c.name })
    console.log(`  Created client: ${c.email} / password`)
  }

  const talent = await prisma.user.create({
    data: {
      email: 'talent@example.com',
      password: pw,
      role: 'talent',
      name: 'Maria Santos',
      emailVerified: now,
      connects: 50,
    },
  })
  console.log(`  Created talent: talent@example.com / password`)

  const jobs = generateJobs()
  let createdCount = 0
  for (const j of jobs) {
    const bp = JOB_BLUEPRINTS[createdCount >> 1] // integer division by 2
    const client = clientRecords[j.posterIndex]
    await prisma.jobPost.create({
      data: {
        title: j.title,
        description: bp.description,
        shortDescription: j.shortDescription,
        location: 'Remote',
        type: 'full-time',
        salaryRange: j.salaryRange,
        skills: JSON.stringify(j.skills),
        status: 'open',
        posterId: client.id,
        posterName: client.name,
      },
    })
    createdCount++
  }

  // Seed subscription plans (tiered pricing)
  const plans = [
    {
      name: 'Free',
      description: 'Get started with basic hiring tools',
      durationMonths: 1,
      priceInCents: 0,
      connectsPerPeriod: null,
      sortOrder: 1,
    },
    {
      name: 'Starter',
      description: 'For growing teams with regular hiring needs',
      durationMonths: 1,
      priceInCents: 4900,
      connectsPerPeriod: 75,
      sortOrder: 2,
    },
    {
      name: 'Growth',
      description: 'For active recruiters who want the best results',
      durationMonths: 1,
      priceInCents: 7900,
      connectsPerPeriod: 200,
      badge: 'Most Popular',
      sortOrder: 3,
    },
    {
      name: 'Scale',
      description: 'For enterprises with high-volume hiring',
      durationMonths: 1,
      priceInCents: 14900,
      connectsPerPeriod: 500,
      sortOrder: 4,
    },
  ]

  for (const p of plans) {
    await prisma.subscriptionPlan.create({ data: p })
  }
  console.log(`  Created ${plans.length} subscription plans`)

  // Give first client a Starter subscription
  const starterPlan = await prisma.subscriptionPlan.findFirstOrThrow({
    where: { name: 'Starter' },
  })
  const periodStart = new Date()
  const periodEnd = new Date()
  periodEnd.setMonth(periodEnd.getMonth() + 1)
  await prisma.clientSubscription.create({
    data: {
      userId: clientRecords[2].id,
      planId: starterPlan.id,
      status: 'active',
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      autoRenew: true,
    },
  })
  console.log('  Created active subscription for VA Talent Co.')

  await prisma.paymentSetting.upsert({
    where: { key: 'active_provider' },
    update: { value: 'stripe' },
    create: { key: 'active_provider', value: 'stripe' },
  })
  console.log('  Set default payment provider to Stripe')

  console.log(`  Created ${createdCount} job posts (${JOB_BLUEPRINTS.length} categories × 2 levels)`)

  // Seed VA subscription plans
  const vaPlans = [
    {
      name: 'Premium VA',
      description: 'Stand out with the Premium VA badge and priority features',
      priceInCents: 999,
      badge: 'Most Popular',
      sortOrder: 1,
      features: JSON.stringify([
        'Premium VA badge on your profile',
        'Priority placement in search results',
        'Application insights dashboard',
        'Priority support',
      ]),
    },
    {
      name: 'Premium VA Pro',
      description: 'Everything in Premium plus advanced tools and analytics',
      priceInCents: 1999,
      sortOrder: 2,
      features: JSON.stringify([
        'Everything in Premium VA',
        'Featured profile badge',
        'Top search placement',
        'Advanced analytics & insights',
        'Profile boost — shown first in category results',
        'Dedicated priority support',
      ]),
    },
  ]

  for (const p of vaPlans) {
    await prisma.vaSubscriptionPlan.create({ data: p })
  }
  console.log(`  Created ${vaPlans.length} VA subscription plans`)

  console.log(`\nDone!`)
}

main()
  .catch((e) => {
    console.error('Seed failed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
