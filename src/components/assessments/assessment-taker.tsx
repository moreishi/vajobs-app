'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { submitAssessment } from '@/actions/assessments'
import type { AssessmentData } from '@/actions/assessments'
import { toast } from 'sonner'

export function AssessmentTaker({
  assessment,
  applicationId,
}: {
  assessment: AssessmentData
  applicationId: string
}) {
  const router = useRouter()
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [started, setStarted] = useState(false)

  function setAnswer(questionId: string, answer: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }))
  }

  async function handleSubmit() {
    const allAnswered = assessment.questions.every((q) => answers[q.id]?.trim())
    if (!allAnswered) {
      toast.error('Please answer all questions before submitting')
      return
    }

    setSubmitting(true)
    const result = await submitAssessment(
      assessment.id,
      applicationId,
      assessment.questions.map((q) => ({
        questionId: q.id,
        answer: answers[q.id] || '',
      })),
    )
    setSubmitting(false)

    if (result.success) {
      toast.success('Assessment submitted successfully')
      router.refresh()
    } else {
      toast.error(result.error || 'Failed to submit')
    }
  }

  if (!started) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{assessment.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {assessment.description && (
            <p className="text-sm text-muted-foreground">{assessment.description}</p>
          )}
          <div className="text-sm text-muted-foreground">
            <p>{assessment.questions.length} question{assessment.questions.length !== 1 ? 's' : ''}</p>
            {assessment.passScore && <p>Pass score: {assessment.passScore}%</p>}
          </div>
          <Button type="button" onClick={() => setStarted(true)}>
            Start Assessment
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{assessment.title}</CardTitle>
        {assessment.description && (
          <p className="text-sm text-muted-foreground">{assessment.description}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {assessment.questions.map((q, i) => (
          <div key={q.id}>
            <p className="mb-2 text-sm font-medium">
              {i + 1}. {q.question}
            </p>
            <textarea
              value={answers[q.id] || ''}
              onChange={(e) => setAnswer(q.id, e.target.value)}
              rows={4}
              placeholder="Your answer..."
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
            />
          </div>
        ))}

        <div className="flex gap-2 pt-2">
          <Button type="button" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Assessment'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
