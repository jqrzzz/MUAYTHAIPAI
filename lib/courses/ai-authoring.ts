/**
 * AI-native course authoring helpers — Claude (via the AI SDK gateway)
 * generates structured course content from operator prompts.
 *
 * Three pure functions, all stateless. Saving is up to the caller via
 * the existing course CRUD endpoints.
 */

import { generateObject } from "ai"
import { z } from "zod"

const MODEL = "openai/gpt-4o-mini"

const SUGGESTED_LESSON_SCHEMA = z.object({
  lessons: z
    .array(
      z.object({
        title: z.string(),
        description: z.string().optional(),
        content_type: z.enum(["video", "text", "quiz", "drill"]).default("text"),
        estimated_minutes: z.number().int().min(1).max(120).default(10),
        suggested_text: z
          .string()
          .optional()
          .describe(
            "If content_type is 'text' or 'drill', a 2-4 paragraph draft body in markdown. Empty for video/quiz."
          ),
        drill_instructions: z
          .string()
          .optional()
          .describe(
            "If content_type is 'drill', step-by-step drill instructions (3-6 steps, numbered)."
          ),
      })
    )
    .min(1),
  module_summary: z.string().optional().describe("One-sentence summary of what this module covers."),
})

export interface SuggestedLesson {
  title: string
  description?: string
  content_type: "video" | "text" | "quiz" | "drill"
  estimated_minutes: number
  suggested_text?: string
  drill_instructions?: string
}

export async function suggestLessonsForModule(params: {
  courseTitle: string
  moduleTitle: string
  moduleDescription?: string
  count?: number
  certLevel?: string | null
  audience?: "beginner" | "intermediate" | "advanced" | "expert" | "master"
}): Promise<{ lessons: SuggestedLesson[]; moduleSummary?: string; model: string }> {
  const count = Math.max(1, Math.min(params.count ?? 3, 6))

  const result = await generateObject({
    model: MODEL,
    schema: SUGGESTED_LESSON_SCHEMA,
    system: `You design Muay Thai course curriculum. Output a balanced sequence of lessons for the given module — typically a mix of text (theory/explanation), video (demo), drill (practice), and one optional quiz at the end. Lessons should flow logically. Be specific to Muay Thai — use Thai terms in italics where natural (teep, mat wiang, sok, khao, wai kru, ram muay, etc.).${
      params.certLevel
        ? `\n\nThis module belongs to the ${params.certLevel.toUpperCase()} certification level (Naga = beginner, Phayra Nak = intermediate, Singha = advanced, Hanuman = expert, Garuda = master). Match technical depth accordingly.`
        : ""
    }`,
    prompt: `Course: ${params.courseTitle}
Module: ${params.moduleTitle}${params.moduleDescription ? `\nModule description: ${params.moduleDescription}` : ""}
Audience level: ${params.audience || "beginner"}

Suggest ${count} lessons for this module. Include drafted text content for any text/drill lessons.`,
    temperature: 0.5,
  })

  return {
    lessons: result.object.lessons,
    moduleSummary: result.object.module_summary,
    model: MODEL,
  }
}

const QUIZ_SCHEMA = z.object({
  questions: z
    .array(
      z.object({
        question_text: z.string(),
        options: z
          .array(
            z.object({
              id: z.enum(["a", "b", "c", "d"]),
              text: z.string(),
              is_correct: z.boolean(),
            })
          )
          .length(4),
        explanation: z.string().describe("1-2 sentences explaining why the correct answer is correct."),
      })
    )
    .min(1),
})

export interface SuggestedQuizQuestion {
  question_text: string
  options: { id: string; text: string; is_correct: boolean }[]
  correct_answer: string
  explanation: string
}

export async function generateQuizForLesson(params: {
  lessonTitle: string
  lessonText?: string
  courseTitle?: string
  count?: number
}): Promise<{ questions: SuggestedQuizQuestion[]; model: string }> {
  const count = Math.max(1, Math.min(params.count ?? 4, 8))

  const result = await generateObject({
    model: MODEL,
    schema: QUIZ_SCHEMA,
    system: `You write multiple-choice quiz questions for a Muay Thai certification course. Each question has exactly 4 options (a, b, c, d), exactly ONE marked is_correct: true. Distractors should be plausible but clearly wrong to anyone who knows the material. Mix question types: technique recall, cultural knowledge, safety, terminology.`,
    prompt: `Course: ${params.courseTitle || "Muay Thai certification"}
Lesson: ${params.lessonTitle}${params.lessonText ? `\n\nLesson content:\n${params.lessonText.slice(0, 4000)}` : ""}

Write ${count} multiple-choice questions on the material above. If lesson content is sparse, use general Muay Thai knowledge consistent with the lesson title.`,
    temperature: 0.4,
  })

  return {
    questions: result.object.questions.map((q) => {
      const correct = q.options.find((o) => o.is_correct)
      return {
        question_text: q.question_text,
        options: q.options,
        correct_answer: correct?.id || "a",
        explanation: q.explanation,
      }
    }),
    model: MODEL,
  }
}

export type ImproveMode = "polish" | "expand" | "shorten" | "translate-th"

export async function improveText(params: {
  text: string
  mode: ImproveMode
  context?: string
}): Promise<{ text: string; model: string }> {
  const promptByMode: Record<ImproveMode, string> = {
    polish:
      "Polish the writing — fix grammar, tighten phrasing, keep the meaning identical. Return the rewritten text only.",
    expand:
      "Expand this into 2-3 well-structured paragraphs with more detail and examples. Keep the original technical claims unchanged. Return the expanded text only.",
    shorten:
      "Shorten this to its essential points while keeping the technical accuracy. Return the shortened text only.",
    "translate-th":
      "Translate this Muay Thai lesson content into clear, natural Thai. Keep technique names in Thai script (e.g. teep → ถีบ, mat wiang → หมัดเหวี่ยง). Return the Thai translation only.",
  }

  const result = await generateObject({
    model: MODEL,
    schema: z.object({ text: z.string() }),
    system:
      "You improve Muay Thai course lesson text. Never add preamble like 'Sure, here's the polished version'. Output ONLY the rewritten text.",
    prompt: `${promptByMode[params.mode]}${params.context ? `\n\nContext: ${params.context}` : ""}\n\nOriginal text:\n${params.text}`,
    temperature: 0.3,
  })

  return { text: result.object.text, model: MODEL }
}
