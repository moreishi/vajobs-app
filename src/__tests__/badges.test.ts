import { describe, it, expect } from 'vitest'
import { computeBadges } from '@/lib/badges'

describe('computeBadges', () => {
  const minimalProfile = {
    verified: false,
    experience: null,
    headline: null,
    bio: null,
    skills: [],
    hourlyRate: null,
  }

  it('returns empty array for empty profile', () => {
    const result = computeBadges(minimalProfile)
    expect(result).toEqual([])
  })

  describe('verified badge', () => {
    it('returns verified when profile is verified', () => {
      const result = computeBadges({ ...minimalProfile, verified: true })
      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({ type: 'verified', label: 'Verified' })
    })

    it('does not return verified when profile is not verified', () => {
      const result = computeBadges({ ...minimalProfile, verified: false })
      expect(result.find((b) => b.type === 'verified')).toBeUndefined()
    })
  })

  describe('expert badge', () => {
    it('returns expert when experience is 5', () => {
      const result = computeBadges({ ...minimalProfile, experience: 5 })
      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({ type: 'expert', label: 'Expert' })
    })

    it('returns expert when experience exceeds 5', () => {
      const result = computeBadges({ ...minimalProfile, experience: 10 })
      expect(result).toHaveLength(1)
      expect(result[0].type).toBe('expert')
    })

    it('does not return expert when experience is 4', () => {
      const result = computeBadges({ ...minimalProfile, experience: 4 })
      expect(result).toEqual([])
    })

    it('does not return expert when experience is null', () => {
      const result = computeBadges({ ...minimalProfile, experience: null })
      expect(result).toEqual([])
    })
  })

  describe('rising-talent badge', () => {
    it('returns rising-talent when profile is complete', () => {
      const result = computeBadges({
        ...minimalProfile,
        headline: 'Developer',
        bio: 'I build things',
        skills: ['React'],
        hourlyRate: 50,
      })
      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({ type: 'rising-talent', label: 'Rising Talent' })
    })

    it('does not return rising-talent when headline is missing', () => {
      const result = computeBadges({
        ...minimalProfile,
        headline: null,
        bio: 'I build things',
        skills: ['React'],
        hourlyRate: 50,
      })
      expect(result.find((b) => b.type === 'rising-talent')).toBeUndefined()
    })

    it('does not return rising-talent when bio is missing', () => {
      const result = computeBadges({
        ...minimalProfile,
        headline: 'Developer',
        bio: null,
        skills: ['React'],
        hourlyRate: 50,
      })
      expect(result.find((b) => b.type === 'rising-talent')).toBeUndefined()
    })

    it('does not return rising-talent when skills are empty', () => {
      const result = computeBadges({
        ...minimalProfile,
        headline: 'Developer',
        bio: 'I build things',
        skills: [],
        hourlyRate: 50,
      })
      expect(result.find((b) => b.type === 'rising-talent')).toBeUndefined()
    })

    it('does not return rising-talent when hourlyRate is missing', () => {
      const result = computeBadges({
        ...minimalProfile,
        headline: 'Developer',
        bio: 'I build things',
        skills: ['React'],
        hourlyRate: null,
      })
      expect(result.find((b) => b.type === 'rising-talent')).toBeUndefined()
    })
  })

  describe('top-rated badge', () => {
    it('returns top-rated when rating >= 4.5 and count >= 1', () => {
      const result = computeBadges(minimalProfile, { rating: { average: 4.5, count: 1 } })
      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({ type: 'top-rated', label: 'Top Rated' })
    })

    it('returns top-rated when rating is 5.0 with many reviews', () => {
      const result = computeBadges(minimalProfile, { rating: { average: 5.0, count: 50 } })
      expect(result).toHaveLength(1)
      expect(result[0].type).toBe('top-rated')
    })

    it('does not return top-rated when rating is below 4.5', () => {
      const result = computeBadges(minimalProfile, { rating: { average: 4.4, count: 5 } })
      expect(result.find((b) => b.type === 'top-rated')).toBeUndefined()
    })

    it('does not return top-rated when count is 0', () => {
      const result = computeBadges(minimalProfile, { rating: { average: 5.0, count: 0 } })
      expect(result.find((b) => b.type === 'top-rated')).toBeUndefined()
    })

    it('does not return top-rated when rating is undefined', () => {
      const result = computeBadges(minimalProfile)
      expect(result.find((b) => b.type === 'top-rated')).toBeUndefined()
    })
  })

  describe('premium badge', () => {
    it('returns premium when hasPremium is true', () => {
      const result = computeBadges(minimalProfile, { hasPremium: true })
      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({ type: 'premium', label: 'Premium VA' })
    })

    it('does not return premium when hasPremium is false', () => {
      const result = computeBadges(minimalProfile, { hasPremium: false })
      expect(result).toEqual([])
    })

    it('does not return premium when hasPremium is undefined', () => {
      const result = computeBadges(minimalProfile)
      expect(result.find((b) => b.type === 'premium')).toBeUndefined()
    })
  })

  describe('multiple badges', () => {
    it('returns verified and expert when both conditions are met', () => {
      const result = computeBadges({
        ...minimalProfile,
        verified: true,
        experience: 5,
      })
      expect(result).toHaveLength(2)
      expect(result.map((b) => b.type).sort()).toEqual(['expert', 'verified'])
    })

    it('returns all applicable badges when all conditions are met', () => {
      const result = computeBadges(
        {
          ...minimalProfile,
          verified: true,
          experience: 7,
          headline: 'Full Stack Developer',
          bio: 'Expert in React and Node.js',
          skills: ['React', 'TypeScript', 'Node.js'],
          hourlyRate: 80,
        },
        { rating: { average: 4.8, count: 25 }, hasPremium: true },
      )
      expect(result).toHaveLength(5)
      const types = result.map((b) => b.type).sort()
      expect(types).toEqual(['expert', 'premium', 'rising-talent', 'top-rated', 'verified'])
    })

    it('returns subset when only some conditions are met', () => {
      const result = computeBadges(
        {
          ...minimalProfile,
          verified: true,
          experience: 2,
          headline: 'Developer',
          bio: null,
          skills: ['React'],
          hourlyRate: 50,
        },
        { hasPremium: false },
      )
      expect(result).toHaveLength(1)
      expect(result[0].type).toBe('verified')
    })
  })

  describe('fast-responder badge', () => {
    it('is defined in config but never computed automatically', () => {
      const result = computeBadges(minimalProfile)
      expect(result.find((b) => b.type === 'fast-responder')).toBeUndefined()
    })
  })

  describe('badge structure', () => {
    it('each badge has type, label, and description', () => {
      const result = computeBadges(
        { ...minimalProfile, verified: true, experience: 5 },
        { hasPremium: true, rating: { average: 4.9, count: 10 } },
      )
      for (const badge of result) {
        expect(badge).toHaveProperty('type')
        expect(badge).toHaveProperty('label')
        expect(badge).toHaveProperty('description')
      }
    })
  })
})
