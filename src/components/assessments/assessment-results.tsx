'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { gradeAssessment } from '@/actions/assessments'
import type { Question } from '@/actions/assessments'
import { toast } from 'sonner'
import { CheckCircleIcon, XCircleIcon } from 'lucide-react'

type AttemptWithDetails = {
  id: string
  answers: { questionId: string; answer: string }[]
  score: number | null
  passed: boolean | null
  completedAt: string | null
  assessment: {
    questions: Question[]
    passScore: number | null
  }
}

export function AssessmentResults({
  attempt,
  isClient,
}: {
  attempt: AttemptWithDetails
  isClient: boolean
}) {
  const router = useRouter()
  const [score, setScore] = useState(attempt.score?.toString() || '')
  const [gradePassed, setGradePassed] = useState(attempt.passed ?? false)
  const [grading, setGrading] = useState(false)

  const questions = attempt.assessment.questions
  const answerMap = new Map(attempt.answers.map((a) => [a.questionId, a.answer]))

  async function handleGrade() {
    const scoreNum = parseInt(score)
    if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 100) {
      toast.error('Score must be between 0 and 100')
      return
    }

    setGrading(true)
    const result = await gradeAssessment(attempt.id, scoreNum, gradePassed)
    setGrading(false)

    if (result.success) {
      toast.success('Assessment graded')
      router.refresh()
    } else {
      toast.error(result.error || 'Failed to grade')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Assessment Results</CardTitle>
        {attempt.completedAt && (
          <p className="text-xs text-muted-foreground">
            Completed {new Date(attempt.completedAt).toLocaleDateString()}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {questions.map((q, i) => (
          <div key={q.id}>
            <p className="text-sm font-medium mb-1">{i + 1}. {q.question}</p>
            <div className="rounded-md bg-muted p-3">
              <p className="text-sm whitespace-pre-wrap">{answerMap.get(q.id) || 'No answer'}</p>
            </div>
          </div>
        ))}

        {isClient && (
          <div className="border-t pt-4 space-y-3">
            <div className="flex items-center gap-4">
              <div className="w-32">
                <label className="text-xs text-muted-foreground">Score (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                  className="mt-1 flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                />
              </div>
              <div className="flex items-center gap-2 pt-4">
                <button
                  onClick={() => setGradePassed(true)}
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    gradePassed
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  <CheckCircleIcon className="h-3.5 w-3.5" />
                  Pass
                </button>
                <button
                  onClick={() => setGradePassed(false)}
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    !gradePassed
                      ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  <XCircleIcon className="h-3.5 w-3.5" />
                  Fail
                </button>
              </div>
            </div>
            <Button type="button" size="sm" onClick={handleGrade} disabled={grading}>
              {grading ? 'Saving...' : 'Save Grade'}
            </Button>
          </div>
        )}

        {!isClient && attempt.score !== null && (
          <div className="border-t pt-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-sm">
              <span className="text-muted-foreground">Score:</span>
              <span className="font-medium">{attempt.score}%</span>
              {attempt.passed !== null && (
                attempt.passed
                  ? <span className="text-green-600 dark:text-green-400 text-xs font-medium">Passed</span>
                  : <span className="text-destructive text-xs font-medium">Failed</span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
