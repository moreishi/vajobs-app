'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createAssessment, updateAssessment, deleteAssessment } from '@/actions/assessments'
import type { AssessmentData } from '@/actions/assessments'
import { toast } from 'sonner'
import { PlusIcon, Trash2Icon, GripVerticalIcon } from 'lucide-react'

function generateId() {
  return Math.random().toString(36).substring(2, 10)
}

export function AssessmentBuilder({
  jobPostId,
  existing,
}: {
  jobPostId: string
  existing?: AssessmentData
}) {
  const router = useRouter()
  const [title, setTitle] = useState(existing?.title || '')
  const [description, setDescription] = useState(existing?.description || '')
  const [passScore, setPassScore] = useState(existing?.passScore?.toString() || '')
  const [questions, setQuestions] = useState(
    existing?.questions || [{ id: generateId(), question: '' }],
  )
  const [saving, setSaving] = useState(false)

  function addQuestion() {
    setQuestions([...questions, { id: generateId(), question: '' }])
  }

  function removeQuestion(index: number) {
    if (questions.length <= 1) return
    setQuestions(questions.filter((_, i) => i !== index))
  }

  function updateQuestion(index: number, value: string) {
    const updated = [...questions]
    updated[index] = { ...updated[index], question: value }
    setQuestions(updated)
  }

  async function handleSave() {
    if (!title.trim()) {
      toast.error('Title is required')
      return
    }
    const validQuestions = questions.filter((q) => q.question.trim())
    if (validQuestions.length === 0) {
      toast.error('At least one question is required')
      return
    }

    setSaving(true)
    const result = existing
      ? await updateAssessment(existing.id, {
          title: title.trim(),
          description: description.trim() || undefined,
          questions: validQuestions,
          passScore: passScore ? parseInt(passScore) : undefined,
        })
      : await createAssessment({
          jobPostId,
          title: title.trim(),
          description: description.trim() || undefined,
          questions: validQuestions,
          passScore: passScore ? parseInt(passScore) : undefined,
        })

    setSaving(false)
    if (result.success) {
      toast.success(existing ? 'Assessment updated' : 'Assessment created')
      router.refresh()
    } else {
      toast.error(result.error || 'Failed to save')
    }
  }

  async function handleDelete() {
    if (!existing) return
    if (!confirm('Delete this assessment? This cannot be undone.')) return
    const result = await deleteAssessment(existing.id)
    if (result.success) {
      toast.success('Assessment deleted')
      router.refresh()
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            {existing ? 'Edit Assessment' : 'Create Assessment'}
          </CardTitle>
          {existing && (
            <Button type="button" variant="destructive" size="sm" onClick={handleDelete}>
              Delete
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="title" className="text-xs">Assessment Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. React Fundamentals"
            className="h-8 text-sm"
          />
        </div>
        <div>
          <Label htmlFor="desc" className="text-xs">Description (optional)</Label>
          <textarea
            id="desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Instructions for the candidate..."
            className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
          />
        </div>
        <div>
          <Label htmlFor="passScore" className="text-xs">Pass Score % (optional)</Label>
          <Input
            id="passScore"
            type="number"
            min={0}
            max={100}
            value={passScore}
            onChange={(e) => setPassScore(e.target.value)}
            placeholder="e.g. 70"
            className="h-8 w-32 text-sm"
          />
        </div>

        {/* Questions */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium">Questions</span>
            <Button type="button" variant="outline" size="sm" onClick={addQuestion}>
              <PlusIcon className="h-3.5 w-3.5 mr-1" />
              Add Question
            </Button>
          </div>
          {questions.map((q, i) => (
            <div key={q.id} className="flex items-start gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-muted text-xs font-medium text-muted-foreground">
                {i + 1}
              </div>
              <div className="flex-1">
                <textarea
                  value={q.question}
                  onChange={(e) => updateQuestion(i, e.target.value)}
                  rows={2}
                  placeholder={`Question ${i + 1}...`}
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeQuestion(i)}
                disabled={questions.length <= 1}
                className="text-destructive hover:text-destructive h-8 w-8 p-0 shrink-0"
              >
                <Trash2Icon className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>

        <div className="flex gap-2 pt-2">
          <Button type="button" size="sm" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : existing ? 'Update Assessment' : 'Create Assessment'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
