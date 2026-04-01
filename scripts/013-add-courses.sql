-- ============================================
-- 013: Online Course System
-- Adds courses, modules, lessons, enrollments,
-- and progress tracking for the learning platform.
-- ============================================

-- ============================================
-- 1. COURSES (top-level programs)
-- ============================================
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  -- NULL org_id = platform-wide course (Naga-to-Garuda system)

  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  short_description TEXT,
  cover_image_url TEXT,

  -- Categorization
  difficulty TEXT DEFAULT 'beginner'
    CHECK (difficulty IN ('beginner', 'intermediate', 'advanced', 'all-levels')),
  category TEXT DEFAULT 'technique'
    CHECK (category IN ('technique', 'conditioning', 'culture', 'certification', 'sparring', 'clinch')),

  -- Certification link (if completing this course earns a cert level)
  certificate_level TEXT,
  -- e.g. 'naga', 'phayra-nak', etc.

  -- Pricing
  is_free BOOLEAN DEFAULT FALSE,
  price_thb INTEGER DEFAULT 0,

  -- Content stats (denormalized for fast display)
  total_modules INTEGER DEFAULT 0,
  total_lessons INTEGER DEFAULT 0,
  estimated_hours NUMERIC(4,1) DEFAULT 0,

  -- Publishing
  status TEXT DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'archived')),
  published_at TIMESTAMPTZ,

  -- Ordering on browse page
  display_order INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_courses_status ON courses(status);
CREATE INDEX idx_courses_org ON courses(org_id);

-- ============================================
-- 2. MODULES (sections within a course)
-- ============================================
CREATE TABLE course_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,

  title TEXT NOT NULL,
  description TEXT,

  module_order INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_modules_course ON course_modules(course_id);

-- ============================================
-- 3. LESSONS (individual learning units)
-- ============================================
CREATE TABLE lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES course_modules(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  -- course_id is denormalized for faster queries

  title TEXT NOT NULL,
  description TEXT,

  -- Content
  content_type TEXT DEFAULT 'video'
    CHECK (content_type IN ('video', 'text', 'quiz', 'drill')),
  video_url TEXT,
  -- Supports YouTube, Vimeo, Mux, Cloudflare Stream, or direct URL
  video_duration_seconds INTEGER,
  text_content TEXT,
  -- Rich text / markdown for text-type lessons

  -- For drill-type lessons
  drill_instructions TEXT,
  drill_duration_minutes INTEGER,

  -- Ordering
  lesson_order INTEGER NOT NULL DEFAULT 0,

  -- Access control
  is_preview BOOLEAN DEFAULT FALSE,
  -- Preview lessons are accessible without enrollment

  estimated_minutes INTEGER DEFAULT 10,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_lessons_module ON lessons(module_id);
CREATE INDEX idx_lessons_course ON lessons(course_id);

-- ============================================
-- 4. ENROLLMENTS (student ↔ course)
-- ============================================
CREATE TABLE enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,

  -- Progress summary (denormalized)
  completed_lessons INTEGER DEFAULT 0,
  total_lessons INTEGER DEFAULT 0,
  progress_pct NUMERIC(5,2) DEFAULT 0,

  status TEXT DEFAULT 'active'
    CHECK (status IN ('active', 'completed', 'paused')),

  -- Payment reference
  payment_method TEXT,
  payment_amount_thb INTEGER,

  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  last_accessed_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, course_id)
);

CREATE INDEX idx_enrollments_user ON enrollments(user_id);
CREATE INDEX idx_enrollments_course ON enrollments(course_id);

-- ============================================
-- 5. LESSON PROGRESS (per-lesson tracking)
-- ============================================
CREATE TABLE lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,

  status TEXT DEFAULT 'not_started'
    CHECK (status IN ('not_started', 'in_progress', 'completed')),

  -- Video progress
  video_position_seconds INTEGER DEFAULT 0,
  -- Resume playback position

  -- Quiz answers (JSONB for flexibility)
  quiz_answers JSONB,
  quiz_score NUMERIC(5,2),

  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  UNIQUE(user_id, lesson_id)
);

CREATE INDEX idx_progress_user_course ON lesson_progress(user_id, course_id);

-- ============================================
-- 6. QUIZ QUESTIONS (for quiz-type lessons)
-- ============================================
CREATE TABLE quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,

  question_text TEXT NOT NULL,
  question_type TEXT DEFAULT 'multiple_choice'
    CHECK (question_type IN ('multiple_choice', 'true_false', 'text')),

  -- Options as JSONB array: [{"id": "a", "text": "...", "is_correct": true}, ...]
  options JSONB,
  correct_answer TEXT,
  explanation TEXT,

  question_order INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_quiz_lesson ON quiz_questions(lesson_id);

-- ============================================
-- 7. RLS POLICIES
-- ============================================
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;

-- Published courses are readable by everyone
CREATE POLICY "Published courses are public"
  ON courses FOR SELECT
  USING (status = 'published');

-- Org admins can manage their own courses
CREATE POLICY "Org admins manage courses"
  ON courses FOR ALL
  USING (
    org_id IS NULL AND EXISTS (
      SELECT 1 FROM org_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
    OR
    EXISTS (
      SELECT 1 FROM org_members
      WHERE user_id = auth.uid()
      AND org_id = courses.org_id
      AND role IN ('owner', 'admin')
    )
  );

-- Modules/lessons follow course visibility
CREATE POLICY "Modules visible with course"
  ON course_modules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE id = course_modules.course_id
      AND status = 'published'
    )
  );

CREATE POLICY "Lessons visible with course"
  ON lessons FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE id = lessons.course_id
      AND status = 'published'
    )
  );

-- Enrollments: users see their own
CREATE POLICY "Users see own enrollments"
  ON enrollments FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can enroll"
  ON enrollments FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Progress: users manage their own
CREATE POLICY "Users manage own progress"
  ON lesson_progress FOR ALL
  USING (user_id = auth.uid());

-- Quiz questions: readable if lesson is visible
CREATE POLICY "Quiz questions visible with lesson"
  ON quiz_questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM lessons
      JOIN courses ON courses.id = lessons.course_id
      WHERE lessons.id = quiz_questions.lesson_id
      AND courses.status = 'published'
    )
  );

-- ============================================
-- 8. UPDATED_AT TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION update_course_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER courses_updated_at
  BEFORE UPDATE ON courses
  FOR EACH ROW EXECUTE FUNCTION update_course_updated_at();

CREATE TRIGGER modules_updated_at
  BEFORE UPDATE ON course_modules
  FOR EACH ROW EXECUTE FUNCTION update_course_updated_at();

CREATE TRIGGER lessons_updated_at
  BEFORE UPDATE ON lessons
  FOR EACH ROW EXECUTE FUNCTION update_course_updated_at();
