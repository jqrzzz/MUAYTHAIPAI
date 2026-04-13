# PHASE 7: ARCHITECTURE ROADMAP REPORT

**Project:** Muay Thai Pai  
**Date:** December 2024  
**Status:** Post-Refactor (Phases 1-6 Complete)

---

## EXECUTIVE SUMMARY

This roadmap provides a comprehensive plan for evolving Muay Thai Pai from a static marketing site with payment processing into a full-featured gym management platform. The plan is divided into 7 architectural domains with a 12-month phased implementation strategy.

**Current State:**
- Static data in TypeScript files (fighters, blog, services)
- Stripe payment processing (live)
- Email notifications via Resend (live)
- No database integration
- No user authentication
- No admin panel

**Target State:**
- Supabase-backed data layer
- Full booking management system
- Student progress tracking
- Certification issuance
- Admin dashboard
- Multi-role authentication

---

## 1. DATA LAYER DESIGN

### 1.1 Database Selection

**Recommended:** Supabase (PostgreSQL)

**Rationale:**
- Native Row Level Security (RLS) for multi-tenant data
- Built-in authentication system
- Real-time subscriptions for live updates
- Edge functions for server-side logic
- Free tier suitable for MVP/pilot phase
- Easy migration path from current static data

### 1.2 Schema Design

#### Core Tables

```
┌─────────────────────────────────────────────────────────────────┐
│                        DATABASE SCHEMA                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐  │
│  │    users     │      │   profiles   │      │    roles     │  │
│  ├──────────────┤      ├──────────────┤      ├──────────────┤  │
│  │ id (pk)      │─────▶│ user_id (fk) │      │ id (pk)      │  │
│  │ email        │      │ full_name    │      │ name         │  │
│  │ created_at   │      │ phone        │      │ permissions  │  │
│  └──────────────┘      │ skill_level  │      └──────────────┘  │
│                        │ role_id (fk) │◀─────────────┘         │
│                        └──────────────┘                        │
│                               │                                │
│              ┌────────────────┼────────────────┐               │
│              ▼                ▼                ▼               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   bookings   │  │ certificates │  │   progress   │         │
│  ├──────────────┤  ├──────────────┤  ├──────────────┤         │
│  │ id (pk)      │  │ id (pk)      │  │ id (pk)      │         │
│  │ user_id (fk) │  │ user_id (fk) │  │ user_id (fk) │         │
│  │ service_id   │  │ level        │  │ sessions     │         │
│  │ date         │  │ issued_at    │  │ techniques   │         │
│  │ time_slot    │  │ certificate  │  │ sparring_hrs │         │
│  │ status       │  │ verified_by  │  │ updated_at   │         │
│  │ payment_id   │  └──────────────┘  └──────────────┘         │
│  │ amount_thb   │                                              │
│  │ amount_usd   │                                              │
│  │ payment_type │                                              │
│  └──────────────┘                                              │
│         │                                                      │
│         ▼                                                      │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐ │
│  │   payments   │      │   services   │      │   fighters   │ │
│  ├──────────────┤      ├──────────────┤      ├──────────────┤ │
│  │ id (pk)      │      │ id (pk)      │      │ id (pk)      │ │
│  │ booking_id   │      │ name         │      │ name         │ │
│  │ stripe_id    │      │ description  │      │ nickname     │ │
│  │ amount       │      │ price_thb    │      │ record       │ │
│  │ currency     │      │ duration     │      │ status       │ │
│  │ status       │      │ category     │      │ bio          │ │
│  │ method       │      │ calendly_url │      │ image_url    │ │
│  └──────────────┘      └──────────────┘      └──────────────┘ │
│                                                                │
│  ┌──────────────┐      ┌──────────────┐                       │
│  │ blog_posts   │      │  blog_tags   │                       │
│  ├──────────────┤      ├──────────────┤                       │
│  │ id (pk)      │      │ post_id (fk) │                       │
│  │ title        │      │ tag          │                       │
│  │ slug         │      └──────────────┘                       │
│  │ content      │                                              │
│  │ excerpt      │                                              │
│  │ author       │                                              │
│  │ category     │                                              │
│  │ image_url    │                                              │
│  │ published_at │                                              │
│  │ is_published │                                              │
│  └──────────────┘                                              │
│                                                                │
└─────────────────────────────────────────────────────────────────┘
```

#### Table Definitions

**users** (managed by Supabase Auth)
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK, auto |
| email | text | UNIQUE, NOT NULL |
| created_at | timestamptz | DEFAULT now() |

**profiles**
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK, auto |
| user_id | uuid | FK → users.id, UNIQUE |
| full_name | text | NOT NULL |
| phone | text | |
| skill_level | text | CHECK (beginner, intermediate, advanced) |
| role_id | uuid | FK → roles.id, DEFAULT 'student' |
| created_at | timestamptz | DEFAULT now() |
| updated_at | timestamptz | DEFAULT now() |

**roles**
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK, auto |
| name | text | UNIQUE, NOT NULL |
| permissions | jsonb | DEFAULT '{}' |

**Role Hierarchy:**
- `student` - Can book, view own progress, view certificates
- `fighter` - Student + appears on fighters page, can view team data
- `trainer` - Fighter + can mark attendance, issue certificates
- `admin` - Full access

**services**
| Column | Type | Constraints |
|--------|------|-------------|
| id | text | PK (e.g., 'group-session') |
| name | text | NOT NULL |
| description | text | |
| price_thb | integer | NOT NULL |
| duration | text | |
| category | text | CHECK (training, certificates) |
| calendly_url | text | |
| is_active | boolean | DEFAULT true |
| sort_order | integer | DEFAULT 0 |

**bookings**
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK, auto |
| user_id | uuid | FK → users.id (nullable for guests) |
| guest_email | text | (for non-registered users) |
| guest_name | text | |
| service_id | text | FK → services.id |
| booking_date | date | NOT NULL |
| time_slot | text | |
| status | text | CHECK (pending, confirmed, completed, cancelled) |
| payment_id | uuid | FK → payments.id |
| notes | text | |
| created_at | timestamptz | DEFAULT now() |

**payments**
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK, auto |
| booking_id | uuid | FK → bookings.id |
| stripe_payment_intent_id | text | UNIQUE |
| amount_thb | integer | NOT NULL |
| amount_usd_cents | integer | NOT NULL |
| currency | text | DEFAULT 'USD' |
| status | text | CHECK (pending, succeeded, failed, refunded) |
| payment_method | text | CHECK (card, cash) |
| metadata | jsonb | |
| created_at | timestamptz | DEFAULT now() |

**certificates**
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK, auto |
| user_id | uuid | FK → users.id |
| level | text | CHECK (naga, phayra-nak, ratchasi, hanuman, garuda) |
| issued_at | timestamptz | DEFAULT now() |
| certificate_url | text | (PDF storage URL) |
| verified_by | uuid | FK → users.id (trainer who issued) |
| booking_id | uuid | FK → bookings.id |

**student_progress**
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK, auto |
| user_id | uuid | FK → users.id, UNIQUE |
| total_sessions | integer | DEFAULT 0 |
| techniques_learned | jsonb | DEFAULT '[]' |
| sparring_hours | decimal | DEFAULT 0 |
| current_level | text | |
| notes | text | |
| updated_at | timestamptz | DEFAULT now() |

**fighters**
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK, auto |
| user_id | uuid | FK → users.id (nullable) |
| name | text | NOT NULL |
| nickname | text | |
| record | text | |
| status | text | CHECK (active, retired) |
| bio | text | |
| image_url | text | |
| sort_order | integer | DEFAULT 0 |

**blog_posts**
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK, auto |
| slug | text | UNIQUE, NOT NULL |
| title | text | NOT NULL |
| content | text | NOT NULL |
| excerpt | text | |
| author | text | |
| category | text | |
| image_url | text | |
| read_time | text | |
| is_published | boolean | DEFAULT false |
| published_at | timestamptz | |
| created_at | timestamptz | DEFAULT now() |
| updated_at | timestamptz | DEFAULT now() |

**blog_tags**
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK, auto |
| post_id | uuid | FK → blog_posts.id |
| tag | text | NOT NULL |
| UNIQUE(post_id, tag) |

### 1.3 Row Level Security (RLS) Policies

```sql
-- Profiles: Users can only read/update their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Bookings: Users see own bookings, staff sees all
CREATE POLICY "Users can view own bookings" ON bookings
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role_id IN ('trainer', 'admin'))
  );

-- Certificates: Users see own, trainers can insert
CREATE POLICY "Users can view own certificates" ON certificates
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Trainers can issue certificates" ON certificates
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role_id IN ('trainer', 'admin'))
  );

-- Blog: Public read, admin write
CREATE POLICY "Public can read published posts" ON blog_posts
  FOR SELECT USING (is_published = true);

CREATE POLICY "Admins can manage posts" ON blog_posts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role_id = 'admin')
  );
```

### 1.4 Migration Strategy

**Phase 1: Seed Static Data**
1. Create migration script: `scripts/001-seed-services.sql`
2. Insert all services from `lib/booking-config.ts`
3. Insert all fighters from `lib/fighters-data.ts`
4. Insert all blog posts from `lib/blog-data.ts`

**Phase 2: Dual-Read Period**
1. API routes read from database first, fallback to static
2. Monitor for discrepancies
3. Verify data integrity

**Phase 3: Cut Over**
1. Remove static data imports
2. Delete static data files
3. Update type imports to generated Supabase types

---

## 2. DOMAIN MODULES

### 2.1 Booking Engine

**Current State:**
- Form submission → Stripe payment → Email confirmation
- No persistence (booking data only in Stripe metadata)
- No booking management

**Target Architecture:**

```
┌─────────────────────────────────────────────────────────────┐
│                     BOOKING ENGINE                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   Client    │    │   Server    │    │  Database   │     │
│  │  Component  │───▶│   Action    │───▶│  (Supabase) │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│         │                 │                   │             │
│         │                 ▼                   │             │
│         │          ┌─────────────┐            │             │
│         │          │   Stripe    │            │             │
│         │          │   Payment   │            │             │
│         │          └─────────────┘            │             │
│         │                 │                   │             │
│         │                 ▼                   │             │
│         │          ┌─────────────┐            │             │
│         │          │   Webhook   │────────────┘             │
│         │          │   Handler   │                          │
│         │          └─────────────┘                          │
│         │                 │                                 │
│         │                 ▼                                 │
│         │          ┌─────────────┐                          │
│         └─────────▶│   Email     │                          │
│                    │   Service   │                          │
│                    └─────────────┘                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**New Capabilities:**
- Booking persistence in database
- Booking status management (pending → confirmed → completed)
- Booking history for registered users
- Admin booking management
- Calendar integration (availability checking)
- Recurring booking support

**Files to Create:**
```
lib/booking/
├── types.ts           # Booking types and schemas
├── actions.ts         # Server actions for CRUD
├── queries.ts         # Database queries
├── availability.ts    # Time slot availability logic
└── calendar.ts        # Calendly/calendar sync
```

### 2.2 Payment Engine

**Current State:**
- Stripe integration (live)
- THB → USD conversion
- Card and cash payment options
- Webhook handling for confirmations

**Target Architecture:**

**New Capabilities:**
- Payment history per user
- Refund processing
- Invoice generation
- Subscription support (memberships)
- Payment analytics
- Multi-currency display

**Files to Create:**
```
lib/payments/
├── types.ts           # Payment types
├── stripe.ts          # Stripe client wrapper
├── actions.ts         # Server actions
├── invoices.ts        # Invoice generation
└── subscriptions.ts   # Subscription management
```

### 2.3 Certification System

**Current State:**
- Certificate programs listed as booking services
- No certificate issuance
- No progress tracking

**Target Architecture:**

```
┌─────────────────────────────────────────────────────────────┐
│                  CERTIFICATION SYSTEM                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Student Journey:                                           │
│                                                             │
│  ┌───────┐   ┌───────┐   ┌───────┐   ┌───────┐   ┌───────┐ │
│  │ Naga  │──▶│Phayra │──▶│Ratchasi──▶│Hanuman│──▶│Garuda │ │
│  │ Lv 1  │   │Nak Lv2│   │ Lv 3  │   │ Lv 4  │   │ Lv 5  │ │
│  │ 3 Days│   │ 5 Days│   │10 Days│   │1 Month│   │2 Month│ │
│  └───────┘   └───────┘   └───────┘   └───────┘   └───────┘ │
│                                                             │
│  Issuance Flow:                                             │
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │  Complete   │───▶│   Trainer   │───▶│  Generate   │     │
│  │  Training   │    │   Verify    │    │ Certificate │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│                                              │              │
│                                              ▼              │
│                     ┌─────────────┐    ┌─────────────┐     │
│                     │   Student   │◀───│   Email +   │     │
│                     │   Profile   │    │   Download  │     │
│                     └─────────────┘    └─────────────┘     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**New Capabilities:**
- Certificate template system
- PDF generation with student details
- Verification QR codes
- Public verification page
- Certificate gallery for students
- Trainer issuance workflow

**Files to Create:**
```
lib/certificates/
├── types.ts           # Certificate types
├── templates/         # Certificate templates
│   ├── naga.tsx
│   ├── phayra-nak.tsx
│   ├── ratchasi.tsx
│   ├── hanuman.tsx
│   └── garuda.tsx
├── generate.ts        # PDF generation
├── verify.ts          # Verification logic
└── actions.ts         # Server actions
```

### 2.4 Student Progress Tracking

**Current State:**
- No progress tracking
- No student profiles

**Target Architecture:**

**Tracked Metrics:**
- Total sessions attended
- Techniques learned (checklist)
- Sparring hours
- Current certification level
- Fitness assessments
- Personal bests
- Trainer notes

**Files to Create:**
```
lib/progress/
├── types.ts           # Progress types
├── actions.ts         # Server actions
├── metrics.ts         # Metric calculations
└── achievements.ts    # Achievement system
```

### 2.5 Content/Blog System

**Current State:**
- Static blog data in `lib/blog-data.ts` (14 posts)
- Client-side filtering and search
- No admin editing capability

**Target Architecture:**

**New Capabilities:**
- Database-backed posts
- Admin editor (rich text)
- Draft/publish workflow
- SEO metadata management
- Image upload to Vercel Blob
- Related posts algorithm
- Reading analytics

**Files to Create:**
```
lib/blog/
├── types.ts           # Blog types
├── queries.ts         # Database queries
├── actions.ts         # Server actions
└── seo.ts             # SEO helpers
```

### 2.6 Admin Console

**Current State:**
- No admin interface
- Manual processes for all operations

**Target Architecture:**

```
┌─────────────────────────────────────────────────────────────┐
│                     ADMIN CONSOLE                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  /admin                                                     │
│  ├── /dashboard        # Overview metrics                   │
│  ├── /bookings         # Booking management                 │
│  │   ├── /[id]         # Single booking detail              │
│  │   └── /calendar     # Calendar view                      │
│  ├── /students         # Student management                 │
│  │   ├── /[id]         # Student profile                    │
│  │   └── /progress     # Progress overview                  │
│  ├── /certificates     # Certificate issuance               │
│  │   └── /issue        # Issue new certificate              │
│  ├── /fighters         # Fighter management                 │
│  │   └── /[id]         # Edit fighter                       │
│  ├── /blog             # Blog management                    │
│  │   ├── /new          # Create post                        │
│  │   └── /[id]         # Edit post                          │
│  ├── /services         # Service/pricing management         │
│  └── /settings         # Gym settings                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Files to Create:**
```
app/admin/
├── layout.tsx         # Admin layout with sidebar
├── page.tsx           # Dashboard
├── bookings/
│   ├── page.tsx       # Booking list
│   ├── [id]/page.tsx  # Booking detail
│   └── calendar/page.tsx
├── students/
│   ├── page.tsx       # Student list
│   └── [id]/page.tsx  # Student detail
├── certificates/
│   ├── page.tsx       # Certificate list
│   └── issue/page.tsx # Issue form
├── fighters/
│   ├── page.tsx       # Fighter list
│   └── [id]/page.tsx  # Edit fighter
├── blog/
│   ├── page.tsx       # Post list
│   ├── new/page.tsx   # Create post
│   └── [id]/page.tsx  # Edit post
└── services/
    └── page.tsx       # Service management
```

---

## 3. API CONTRACT MAP

### 3.1 Current Endpoints

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| `/api/create-payment-intent` | POST | Create Stripe payment | LIVE |
| `/api/webhooks/stripe` | POST | Handle Stripe webhooks | LIVE |
| `/api/send-booking-confirmation` | POST | Send confirmation emails | LIVE |
| `/api/send-booking-emails` | POST | Send booking emails | LIVE |
| `/api/test-email` | GET | Test email configuration | DEV |

### 3.2 Planned Endpoints

#### Booking Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/bookings` | GET | List bookings (filtered) |
| `/api/bookings` | POST | Create booking |
| `/api/bookings/[id]` | GET | Get booking detail |
| `/api/bookings/[id]` | PATCH | Update booking status |
| `/api/bookings/[id]` | DELETE | Cancel booking |
| `/api/bookings/availability` | GET | Get available time slots |

#### Student Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/students` | GET | List students (admin) |
| `/api/students/[id]` | GET | Get student profile |
| `/api/students/[id]/progress` | GET | Get student progress |
| `/api/students/[id]/progress` | PATCH | Update progress |
| `/api/students/[id]/certificates` | GET | Get student certificates |

#### Certificate Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/certificates` | GET | List certificates |
| `/api/certificates` | POST | Issue certificate |
| `/api/certificates/[id]` | GET | Get certificate |
| `/api/certificates/[id]/verify` | GET | Verify certificate (public) |
| `/api/certificates/[id]/download` | GET | Download PDF |

#### Blog Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/blog` | GET | List posts (public, published) |
| `/api/blog` | POST | Create post (admin) |
| `/api/blog/[slug]` | GET | Get post by slug |
| `/api/blog/[id]` | PATCH | Update post (admin) |
| `/api/blog/[id]` | DELETE | Delete post (admin) |

#### Fighter Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/fighters` | GET | List fighters (public) |
| `/api/fighters` | POST | Add fighter (admin) |
| `/api/fighters/[id]` | PATCH | Update fighter (admin) |
| `/api/fighters/[id]` | DELETE | Remove fighter (admin) |

### 3.3 Request/Response Schemas

**POST /api/bookings**
```typescript
// Request
interface CreateBookingRequest {
  serviceId: string
  date: string // ISO date
  timeSlot: string
  customerName: string
  customerEmail: string
  customerPhone?: string
  paymentMethod: 'card' | 'cash'
  notes?: string
}

// Response
interface CreateBookingResponse {
  booking: {
    id: string
    status: 'pending' | 'confirmed'
    service: ServiceSummary
    date: string
    timeSlot: string
  }
  payment?: {
    clientSecret: string // For card payments
    amount: number
  }
}
```

**POST /api/certificates**
```typescript
// Request
interface IssueCertificateRequest {
  studentId: string
  level: 'naga' | 'phayra-nak' | 'ratchasi' | 'hanuman' | 'garuda'
  bookingId?: string
  notes?: string
}

// Response
interface IssueCertificateResponse {
  certificate: {
    id: string
    level: string
    issuedAt: string
    downloadUrl: string
    verificationUrl: string
  }
}
```

### 3.4 RSC vs Client vs Server Actions Strategy

| Operation | Pattern | Rationale |
|-----------|---------|-----------|
| Read public data (services, fighters, blog) | RSC | SEO, fast initial load |
| Read user-specific data (bookings, progress) | RSC + Suspense | Auth required, streaming |
| Create/update operations | Server Actions | Form handling, validation |
| Real-time updates | Client + SWR | Live data refresh |
| Payment processing | Server Actions | Security, Stripe API |
| File uploads | API Route | Multipart handling |
| Webhooks | API Route | External callbacks |

---

## 4. AUTH INTEGRATION DESIGN

### 4.1 Authentication Strategy

**Provider:** Supabase Auth

**Methods:**
- Email/Password (primary)
- Magic Link (optional)
- OAuth: Google (future)

### 4.2 User Registration Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    REGISTRATION FLOW                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │  Sign Up    │───▶│   Verify    │───▶│  Complete   │     │
│  │   Form      │    │   Email     │    │   Profile   │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│         │                                     │             │
│         │                                     ▼             │
│         │                             ┌─────────────┐       │
│         │                             │   Assign    │       │
│         │                             │  Student    │       │
│         │                             │   Role      │       │
│         │                             └─────────────┘       │
│         │                                     │             │
│         ▼                                     ▼             │
│  ┌─────────────────────────────────────────────────┐       │
│  │                  DASHBOARD                       │       │
│  │  - View bookings                                │       │
│  │  - Track progress                               │       │
│  │  - Download certificates                        │       │
│  └─────────────────────────────────────────────────┘       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 4.3 Role Hierarchy

| Role | Permissions |
|------|-------------|
| `student` | View own profile, bookings, progress, certificates |
| `fighter` | Student + Public fighter profile, team data |
| `trainer` | Fighter + Mark attendance, issue certificates, view all students |
| `admin` | Full access to all features and data |

### 4.4 Protected Routes

| Route Pattern | Required Role |
|---------------|---------------|
| `/dashboard` | student+ |
| `/dashboard/bookings` | student+ |
| `/dashboard/progress` | student+ |
| `/dashboard/certificates` | student+ |
| `/admin/*` | admin |
| `/admin/certificates/issue` | trainer+ |
| `/admin/students/*` | trainer+ |

### 4.5 Middleware Implementation

```typescript
// middleware.ts (planned)
const PROTECTED_ROUTES = {
  '/dashboard': ['student', 'fighter', 'trainer', 'admin'],
  '/admin': ['admin'],
  '/admin/certificates/issue': ['trainer', 'admin'],
  '/admin/students': ['trainer', 'admin'],
}
```

---

## 5. FUTURE SUBSYSTEMS

### 5.1 Subscriptions & Memberships

**Use Case:** Monthly gym membership auto-renewal

**Implementation:**
- Stripe Subscriptions API
- Monthly billing cycle
- Proration handling
- Cancellation/pause support
- Member benefits tracking

**Tables:**
- `subscriptions` (user_id, stripe_subscription_id, status, current_period_start/end)
- `membership_benefits` (subscription_id, benefit_type, usage_count)

### 5.2 Video Library

**Use Case:** Online training content for remote students

**Implementation:**
- Vercel Blob for video storage
- Mux for video processing/streaming (or direct Blob URLs for MVP)
- Progress tracking per video
- Certificate requirement: watch X videos

**Tables:**
- `videos` (id, title, description, url, duration, category, level)
- `video_progress` (user_id, video_id, watched_seconds, completed)

### 5.3 Automated Certificate Generation

**Use Case:** Self-service certificate download after completing program

**Implementation:**
- PDF generation with @react-pdf/renderer
- Template per level with student name, date, QR code
- Vercel Blob storage for generated PDFs
- Automatic email on generation

### 5.4 Multi-Gym Support

**Use Case:** Expand to multiple locations or franchise model

**Implementation:**
- `gyms` table (id, name, location, timezone, settings)
- All tables get `gym_id` foreign key
- RLS policies scoped to gym
- Sub-domain or path-based routing

**Complexity:** HIGH - significant schema changes, defer to Year 2

---

## 6. TECHNICAL DEBT FORECAST

### 6.1 Current Technical Debt

| Issue | Severity | Location | Resolution |
|-------|----------|----------|------------|
| Large blog page (650+ lines) | MEDIUM | `app/blog/page.tsx` | Extract components |
| No input validation | HIGH | All API routes | Add Zod schemas |
| No rate limiting | MEDIUM | API routes | Add middleware |
| No error tracking | HIGH | Global | Add Sentry |
| No analytics | LOW | Global | Add Vercel Analytics |
| Hard-coded strings | LOW | Various | Create constants file |

### 6.2 Projected Technical Debt

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Database query performance | MEDIUM | HIGH | Add indexes, query optimization |
| Auth session management | LOW | HIGH | Follow Supabase best practices |
| File storage limits | LOW | MEDIUM | Monitor Blob usage, archive old files |
| Email deliverability | LOW | MEDIUM | Monitor Resend reputation |
| Payment failures | LOW | HIGH | Implement retry logic, alerts |

### 6.3 Scalability Concerns

| Concern | Threshold | Mitigation |
|---------|-----------|------------|
| Database connections | 100 concurrent | Connection pooling via Supabase |
| Image storage | 10GB | Optimize images, archive old content |
| Email volume | 100/day | Upgrade Resend plan if needed |
| Stripe API rate limits | 100 req/sec | Implement queuing for bulk ops |

### 6.4 Required Cleanup Before Scale

1. **Input Validation**: Add Zod schemas to all API routes
2. **Error Handling**: Implement global error boundary, Sentry integration
3. **Logging**: Add structured logging for debugging
4. **Testing**: Add unit tests for business logic, E2E for critical flows
5. **Documentation**: API documentation with OpenAPI/Swagger

---

## 7. 12-MONTH EVOLUTION PLAN

### Phase 1: MVP (Months 1-3)

**Goal:** Database integration, basic auth, booking persistence

**Deliverables:**
- [ ] Supabase integration setup
- [ ] Database schema creation
- [ ] Data migration from static files
- [ ] User authentication (email/password)
- [ ] Booking persistence
- [ ] User dashboard (view bookings)

**Success Metrics:**
- All bookings stored in database
- 100% of payments tracked
- User accounts functional

### Phase 2: Pilot (Months 4-6)

**Goal:** Progress tracking, certificate system, admin panel

**Deliverables:**
- [ ] Student progress tracking
- [ ] Certificate generation
- [ ] Admin dashboard (basic)
- [ ] Booking management
- [ ] Fighter management
- [ ] Blog CMS

**Success Metrics:**
- 50+ student accounts
- 10+ certificates issued
- Admin can manage all content

### Phase 3: Production (Months 7-9)

**Goal:** Full feature set, polish, optimization

**Deliverables:**
- [ ] Complete admin panel
- [ ] Email notification improvements
- [ ] Payment history
- [ ] Refund processing
- [ ] Mobile optimization audit
- [ ] Performance optimization
- [ ] Error tracking (Sentry)
- [ ] Analytics integration

**Success Metrics:**
- < 3s page load time
- < 1% error rate
- 95% email delivery rate

### Phase 4: Expansion (Months 10-12)

**Goal:** Advanced features, growth preparation

**Deliverables:**
- [ ] Subscription/membership system
- [ ] Video library (basic)
- [ ] Public API documentation
- [ ] Automated certificate issuance
- [ ] Multi-language support (Thai/English)
- [ ] SEO optimization

**Success Metrics:**
- 100+ active users
- 5+ recurring memberships
- Top 3 Google ranking for "Muay Thai Pai"

---

## APPENDIX A: FILE STRUCTURE (TARGET)

```
pai-muay-thai/
├── app/
│   ├── (public)/              # Public routes
│   │   ├── page.tsx           # Homepage
│   │   ├── classes/
│   │   ├── fighters/
│   │   ├── blog/
│   │   ├── contact/
│   │   └── ...
│   ├── (auth)/                # Auth routes
│   │   ├── login/
│   │   ├── register/
│   │   └── reset-password/
│   ├── dashboard/             # User dashboard
│   │   ├── page.tsx
│   │   ├── bookings/
│   │   ├── progress/
│   │   └── certificates/
│   ├── admin/                 # Admin panel
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── bookings/
│   │   ├── students/
│   │   ├── certificates/
│   │   ├── fighters/
│   │   ├── blog/
│   │   └── services/
│   └── api/
│       ├── auth/
│       ├── bookings/
│       ├── students/
│       ├── certificates/
│       ├── blog/
│       ├── fighters/
│       └── webhooks/
├── components/
│   ├── ui/                    # shadcn components
│   ├── payment/               # Payment flow (done)
│   ├── booking/               # Booking components
│   ├── dashboard/             # Dashboard components
│   └── admin/                 # Admin components
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   ├── booking/
│   ├── payments/
│   ├── certificates/
│   ├── progress/
│   └── blog/
├── types/
│   ├── database.ts            # Generated Supabase types
│   └── index.ts
└── scripts/
    ├── migrations/
    └── seed/
```

---

## APPENDIX B: DECISION LOG

| Decision | Rationale | Date |
|----------|-----------|------|
| Supabase over Neon | Built-in auth, RLS, real-time | Dec 2024 |
| Keep Stripe (USD) | Already working, good UX | Dec 2024 |
| Server Actions over API Routes | Better DX, type safety | Dec 2024 |
| Modular lib/ structure | Maintainability, testing | Dec 2024 |
| PDF certificates | Portable, verifiable | Dec 2024 |

---

## APPENDIX C: RISKS AND MITIGATIONS

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Supabase free tier limits | LOW | MEDIUM | Monitor usage, upgrade path clear |
| Auth complexity | MEDIUM | HIGH | Start with email only, add OAuth later |
| Data migration errors | LOW | HIGH | Thorough testing, rollback plan |
| Payment edge cases | MEDIUM | HIGH | Comprehensive webhook handling |
| Performance degradation | LOW | MEDIUM | Add monitoring early |

---

**Report Generated:** December 2024  
**Next Review:** March 2025 (Post-MVP)
