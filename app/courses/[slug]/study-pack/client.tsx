"use client"

/**
 * Study Pack — printable view of the entire course.
 *
 * Design: light theme (off-white paper feel), serif body, Cinzel for
 * display. Browser print → save as PDF works. @media print rules hide
 * UI chrome + paginate cleanly.
 *
 * Layout sections in order:
 *   1. Print toolbar (hidden when printing)
 *   2. Title page: cover image, course name, certificate level, gym,
 *      student name, generated date
 *   3. Table of contents
 *   4. Each module: header + each lesson in order
 *   5. Footer disclaimer
 */
import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Printer, Dumbbell, HelpCircle, Loader2 } from "lucide-react"

interface QuizOption {
  id: string
  text: string
}

interface QuizQuestion {
  id: string
  question_text: string
  question_type: string
  options: QuizOption[] | null
  explanation: string | null
  question_order: number
}

interface GalleryItem {
  url: string
  caption?: string | null
  alt?: string | null
}

interface Lesson {
  id: string
  title: string
  description: string | null
  content_type: string
  lesson_order: number
  video_url: string | null
  video_duration_seconds: number | null
  text_content: string | null
  drill_instructions: string | null
  drill_duration_minutes: number | null
  estimated_minutes: number | null
  hero_image_url: string | null
  gallery: GalleryItem[] | null
  quiz_questions: QuizQuestion[]
}

interface Module {
  id: string
  title: string
  description: string | null
  module_order: number
  lessons: Lesson[]
}

interface Course {
  id: string
  title: string
  slug: string
  description: string | null
  short_description: string | null
  cover_image_url: string | null
  certificate_level: string | null
  difficulty: string
  total_modules: number
  total_lessons: number
  estimated_hours: number
}

export default function StudyPackClient({
  course,
  gymName,
  gymLogoUrl,
  studentName,
  modules,
}: {
  course: Course
  gymName: string | null
  gymLogoUrl: string | null
  studentName: string | null
  modules: Module[]
}) {
  const [printing, setPrinting] = useState(false)
  const generatedDate = new Date().toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  useEffect(() => {
    // Set print metadata so the saved PDF gets a nice filename
    const orig = document.title
    document.title = `${course.title} — Study Pack`
    return () => {
      document.title = orig
    }
  }, [course.title])

  const handlePrint = () => {
    setPrinting(true)
    setTimeout(() => {
      window.print()
      setPrinting(false)
    }, 50)
  }

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900">
      {/* Print stylesheet — hides UI, paginates, removes shadows */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            color: #000 !important;
          }
          .no-print {
            display: none !important;
          }
          .study-pack-page {
            background: white !important;
          }
          .study-pack-lesson {
            page-break-inside: avoid;
            page-break-after: always;
          }
          .study-pack-module {
            page-break-before: always;
          }
          .study-pack-cover {
            page-break-after: always;
          }
          .study-pack-toc {
            page-break-after: always;
          }
          h1, h2, h3 {
            page-break-after: avoid;
          }
          img {
            max-height: 360px !important;
            object-fit: contain !important;
          }
          a {
            color: #000 !important;
            text-decoration: none !important;
          }
        }
        @page {
          size: A4;
          margin: 20mm 18mm;
        }
      `}</style>

      {/* Toolbar — hidden on print */}
      <div className="no-print sticky top-0 z-50 border-b border-stone-200 bg-stone-50/95 backdrop-blur-sm">
        <div className="mx-auto max-w-4xl px-5 h-14 flex items-center justify-between gap-3">
          <Link
            href={`/courses/${course.slug}`}
            className="flex items-center gap-1.5 text-sm text-stone-600 hover:text-stone-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to course
          </Link>
          <p className="text-[11px] uppercase tracking-[0.18em] text-stone-500 truncate text-center">
            Study Pack
          </p>
          <button
            onClick={handlePrint}
            disabled={printing}
            className="inline-flex items-center gap-1.5 rounded-lg bg-stone-900 hover:bg-stone-700 text-white text-sm px-3 py-1.5 transition-colors disabled:opacity-50"
            title="Print or save as PDF"
          >
            {printing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Printer className="h-3.5 w-3.5" />
            )}
            Print / Save PDF
          </button>
        </div>
      </div>

      {/* Hint banner — hidden on print */}
      <div className="no-print mx-auto max-w-4xl px-5 mt-5">
        <div className="rounded-lg ring-1 ring-stone-200 bg-stone-50 px-4 py-3 text-[12px] text-stone-600 leading-relaxed">
          When you tap <strong className="text-stone-900">Print / Save PDF</strong>,
          your browser opens a print dialog. Pick &ldquo;Save as PDF&rdquo; as the
          destination to download a clean copy you can study offline or hand to a
          student. Color photos print best on a color printer; for grayscale,
          select &ldquo;Black &amp; white&rdquo; in the print options.
        </div>
      </div>

      {/* Page content */}
      <article className="study-pack-page mx-auto max-w-4xl px-5 sm:px-12 py-10 print:p-0 bg-white print:bg-transparent shadow-sm print:shadow-none">
        {/* COVER */}
        <section className="study-pack-cover text-center pt-8 pb-16">
          {course.cover_image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={course.cover_image_url}
              alt={course.title}
              className="mx-auto mb-8 w-full max-w-md aspect-video object-cover rounded-lg"
            />
          )}
          {course.certificate_level && (
            <p
              className="text-[12px] uppercase tracking-[0.24em] text-stone-500 mb-3"
              style={{ fontFamily: 'Cinzel, Georgia, serif' }}
            >
              {course.certificate_level} · Certification Level
            </p>
          )}
          <h1
            className="text-[42px] sm:text-[56px] leading-tight text-stone-900 mb-4"
            style={{ fontFamily: 'Cinzel, "Cormorant Garamond", Georgia, serif' }}
          >
            {course.title}
          </h1>
          {course.short_description && (
            <p
              className="text-[18px] text-stone-600 max-w-2xl mx-auto leading-relaxed italic"
              style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}
            >
              {course.short_description}
            </p>
          )}
          <div className="mt-12 inline-flex flex-col items-center gap-2">
            {gymLogoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={gymLogoUrl}
                alt={gymName ?? "Gym"}
                className="h-12 w-12 object-contain rounded"
              />
            )}
            {gymName && (
              <p
                className="text-[14px] text-stone-700"
                style={{ fontFamily: 'Cinzel, Georgia, serif' }}
              >
                {gymName}
              </p>
            )}
            {studentName && (
              <p className="text-[12px] text-stone-500 mt-2">
                Prepared for <strong className="text-stone-700">{studentName}</strong>
              </p>
            )}
            <p className="text-[11px] text-stone-400 mt-1">{generatedDate}</p>
          </div>
        </section>

        {/* TABLE OF CONTENTS */}
        <section className="study-pack-toc">
          <h2
            className="text-[28px] mb-6 text-stone-900"
            style={{ fontFamily: 'Cinzel, Georgia, serif' }}
          >
            Contents
          </h2>
          <ol className="space-y-3">
            {modules.map((m, i) => (
              <li key={m.id}>
                <p className="text-[15px] text-stone-800">
                  <span className="text-stone-500 mr-2 tabular-nums">
                    {(i + 1).toString().padStart(2, "0")}.
                  </span>
                  <strong style={{ fontFamily: 'Cinzel, Georgia, serif' }}>
                    {m.title}
                  </strong>
                </p>
                {m.lessons.length > 0 && (
                  <ul className="ml-7 mt-1 space-y-0.5 text-[13px] text-stone-600">
                    {m.lessons.map((l, j) => (
                      <li key={l.id} className="flex items-baseline gap-2">
                        <span className="text-stone-400 tabular-nums">
                          {i + 1}.{j + 1}
                        </span>
                        <span>{l.title}</span>
                        <span className="ml-auto text-[11px] text-stone-400">
                          {lessonTypeLabel(l.content_type)}
                          {l.estimated_minutes ? ` · ${l.estimated_minutes}m` : ""}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ol>
        </section>

        {/* MODULES + LESSONS */}
        {modules.map((module, mi) => (
          <section key={module.id} className="study-pack-module">
            <header className="pt-8 mb-8 border-b border-stone-200 pb-4">
              <p
                className="text-[11px] uppercase tracking-[0.24em] text-stone-500 mb-1"
                style={{ fontFamily: 'Cinzel, Georgia, serif' }}
              >
                Module {mi + 1}
              </p>
              <h2
                className="text-[32px] text-stone-900"
                style={{ fontFamily: 'Cinzel, Georgia, serif' }}
              >
                {module.title}
              </h2>
              {module.description && (
                <p
                  className="text-[16px] text-stone-600 leading-relaxed italic mt-2"
                  style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}
                >
                  {module.description}
                </p>
              )}
            </header>

            {module.lessons.map((lesson, li) => (
              <article key={lesson.id} className="study-pack-lesson mb-12">
                <header className="mb-4">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-stone-500">
                    Lesson {mi + 1}.{li + 1} · {lessonTypeLabel(lesson.content_type)}
                  </p>
                  <h3
                    className="text-[24px] text-stone-900 mt-1"
                    style={{ fontFamily: 'Cinzel, Georgia, serif' }}
                  >
                    {lesson.title}
                  </h3>
                  {lesson.description && (
                    <p
                      className="text-[15px] text-stone-600 italic leading-relaxed mt-2"
                      style={{
                        fontFamily: '"Cormorant Garamond", Georgia, serif',
                      }}
                    >
                      {lesson.description}
                    </p>
                  )}
                </header>

                {/* Hero image */}
                {lesson.hero_image_url && (
                  <figure className="mb-5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={lesson.hero_image_url}
                      alt={lesson.title}
                      className="w-full max-h-[420px] object-cover rounded-md"
                    />
                  </figure>
                )}

                {/* Video — print can't play it, surface URL as a QR-readable note */}
                {lesson.content_type === "video" && lesson.video_url && (
                  <div className="mb-5 rounded-md bg-stone-100 border border-stone-200 p-4 text-[13px] text-stone-700">
                    <p className="font-medium">Demonstration video</p>
                    <p className="text-[11px] text-stone-500 mt-1 break-all">
                      {lesson.video_url}
                    </p>
                  </div>
                )}

                {/* Body text */}
                {lesson.content_type === "text" && lesson.text_content && (
                  <div
                    className="text-[16px] text-stone-800 leading-[1.7] whitespace-pre-wrap mb-5"
                    style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}
                  >
                    {lesson.text_content}
                  </div>
                )}

                {/* Drill instructions */}
                {lesson.content_type === "drill" && lesson.drill_instructions && (
                  <div className="mb-5 rounded-md border border-orange-200 bg-orange-50 p-5">
                    <div className="flex items-baseline gap-2 mb-3">
                      <Dumbbell className="h-4 w-4 text-orange-700 self-center" />
                      <p
                        className="text-[12px] uppercase tracking-[0.14em] text-orange-700"
                        style={{ fontFamily: 'Cinzel, Georgia, serif' }}
                      >
                        Training Drill
                      </p>
                      {lesson.drill_duration_minutes && (
                        <span className="ml-auto text-[12px] text-orange-700">
                          {lesson.drill_duration_minutes} min
                        </span>
                      )}
                    </div>
                    <div
                      className="text-[16px] text-stone-800 leading-[1.7] whitespace-pre-wrap"
                      style={{
                        fontFamily: '"Cormorant Garamond", Georgia, serif',
                      }}
                    >
                      {lesson.drill_instructions}
                    </div>
                  </div>
                )}

                {/* Quiz questions — print without answers (study tool) */}
                {lesson.content_type === "quiz" && lesson.quiz_questions.length > 0 && (
                  <div className="mb-5 rounded-md border border-stone-200 bg-stone-50 p-5">
                    <div className="flex items-baseline gap-2 mb-3">
                      <HelpCircle className="h-4 w-4 text-stone-600 self-center" />
                      <p
                        className="text-[12px] uppercase tracking-[0.14em] text-stone-600"
                        style={{ fontFamily: 'Cinzel, Georgia, serif' }}
                      >
                        Self-Quiz
                      </p>
                    </div>
                    <ol className="space-y-4">
                      {lesson.quiz_questions
                        .slice()
                        .sort((a, b) => a.question_order - b.question_order)
                        .map((q, qi) => (
                          <li key={q.id} className="text-[15px] text-stone-800">
                            <p>
                              <span className="text-stone-500 mr-2">{qi + 1}.</span>
                              {q.question_text}
                            </p>
                            {q.options && q.options.length > 0 && (
                              <ul className="ml-7 mt-2 space-y-1 text-stone-600">
                                {q.options.map((o, oi) => (
                                  <li
                                    key={o.id}
                                    className="text-[14px] flex items-baseline gap-2"
                                  >
                                    <span className="text-stone-400 inline-flex items-center justify-center w-5 h-5 border border-stone-300 rounded-full text-[11px]">
                                      {String.fromCharCode(65 + oi)}
                                    </span>
                                    {o.text}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </li>
                        ))}
                    </ol>
                    <p className="mt-4 text-[11px] text-stone-500 italic">
                      Answer key available in the online course. Test yourself
                      first.
                    </p>
                  </div>
                )}

                {/* Gallery */}
                {lesson.gallery && lesson.gallery.length > 0 && (
                  <section className="mt-5">
                    <p
                      className="text-[11px] uppercase tracking-[0.18em] text-stone-500 mb-2"
                      style={{ fontFamily: 'Cinzel, Georgia, serif' }}
                    >
                      Reference Photos
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      {lesson.gallery.map((item, gi) => (
                        <figure
                          key={gi}
                          className="rounded-md overflow-hidden border border-stone-200 bg-stone-50"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.url}
                            alt={item.alt || item.caption || `Reference ${gi + 1}`}
                            className="w-full aspect-[4/3] object-cover"
                          />
                          {item.caption && (
                            <figcaption className="px-2 py-1.5 text-[11px] text-stone-600 leading-snug">
                              {item.caption}
                            </figcaption>
                          )}
                        </figure>
                      ))}
                    </div>
                  </section>
                )}
              </article>
            ))}
          </section>
        ))}

        {/* FOOTER */}
        <footer className="mt-16 pt-6 border-t border-stone-200 text-center text-[11px] text-stone-500">
          <p>
            {course.title}
            {gymName && (
              <>
                {" "}— prepared by{" "}
                <strong className="text-stone-700">{gymName}</strong>
              </>
            )}
          </p>
          <p className="mt-1">Study Pack generated {generatedDate} · MUAYTHAIPAI</p>
          <p className="mt-3 text-stone-400 italic">
            Practice the techniques, not just the words.
          </p>
        </footer>
      </article>
    </div>
  )
}

function lessonTypeLabel(t: string): string {
  if (t === "video") return "Video"
  if (t === "text") return "Reading"
  if (t === "quiz") return "Self-quiz"
  if (t === "drill") return "Drill"
  return t
}
