# MUAY THAI PAI - MULTI-PHASE REFACTOR EXECUTION PLAN

Generated: December 2024
Status: Ready for Automatic Editing

---

## EXECUTIVE SUMMARY

| Phase | Priority | Risk | Time Est. | Description |
|-------|----------|------|-----------|-------------|
| 1 | HIGH | LOW | 15 min | Delete duplicates & dead code |
| 2 | HIGH | LOW | 20 min | Consolidate email services |
| 3 | MEDIUM | LOW | 30 min | Extract blog data to separate file |
| 4 | MEDIUM | MEDIUM | 45 min | Split payment flow into components |
| 5 | LOW | LOW | 20 min | Add loading/error boundaries |
| 6 | LOW | LOW | 15 min | Add environment variable validation |
| 7 | PLANNING | N/A | N/A | Long-term architecture roadmap |

**Total Estimated Time: ~2.5 hours**

---

## PHASE 1: DELETE DUPLICATES & DEAD CODE

**Priority:** HIGH  
**Risk:** LOW  
**Time:** 15 minutes  
**Dependencies:** None

### 1.1 DeleteFile Operations

| # | File to Delete | Reason |
|---|----------------|--------|
| 1 | `components/ui/use-mobile.tsx` | Duplicate of `hooks/use-mobile.tsx` |
| 2 | `lib/email-service-setup.tsx` | Duplicate/deprecated - uses mock emails |
| 3 | `app/classes/page-client.tsx` | Old file, replaced by `app/classes/client.tsx` |

### 1.2 Files That Import Deleted Files

**Check before deletion:**

```
# Search for imports of files being deleted
grep -r "ui/use-mobile" --include="*.tsx" --include="*.ts"
grep -r "email-service-setup" --include="*.tsx" --include="*.ts"
grep -r "page-client" app/classes/
```

**Current imports found:**

| Deleted File | Imported By | Line | Action Required |
|--------------|-------------|------|-----------------|
| `components/ui/use-mobile.tsx` | `components/ui/sidebar.tsx` | 8 | Update import path |
| `lib/email-service-setup.tsx` | `app/api/send-booking-confirmation/route.ts` | 2 | Update to use EmailService |

### 1.3 Import Updates Required

**File:** `components/ui/sidebar.tsx`
```typescript
// BEFORE (Line 8)
import { useIsMobile } from '@/hooks/use-mobile'

// AFTER - No change needed, already using correct path
import { useIsMobile } from '@/hooks/use-mobile'
```

**File:** `app/api/send-booking-confirmation/route.ts`
```typescript
// BEFORE
import { sendBookingConfirmation, sendStaffNotification } from "@/lib/email-service-setup"

// AFTER
import { EmailService } from "@/lib/email-service"
// Then use: const emailService = EmailService.getInstance()
```

### 1.4 Execution Commands

```bash
# Phase 1 Execution
DeleteFile: components/ui/use-mobile.tsx
DeleteFile: lib/email-service-setup.tsx  
DeleteFile: app/classes/page-client.tsx

# Update imports in:
UpdateFile: app/api/send-booking-confirmation/route.ts
```

### 1.5 Rollback Plan

- All files exist in git history
- `git checkout HEAD~1 -- <filepath>` to restore any file

---

## PHASE 2: CONSOLIDATE EMAIL SERVICES

**Priority:** HIGH  
**Risk:** LOW  
**Time:** 20 minutes  
**Dependencies:** Phase 1 complete

### 2.1 Current State

| File | Type | Used By | Status |
|------|------|---------|--------|
| `lib/email-service.tsx` | Class (Singleton) | Webhooks, test-email, send-booking-emails | KEEP |
| `lib/email-service-setup.tsx` | Functions + UI | send-booking-confirmation | DELETE |

### 2.2 Files to Update

**File 1:** `app/api/send-booking-confirmation/route.ts`

```typescript
// CURRENT CODE
import { sendBookingConfirmation, sendStaffNotification } from "@/lib/email-service-setup"

export async function POST(request: Request) {
  // ... parsing logic
  await sendBookingConfirmation(bookingData)
  await sendStaffNotification(bookingData)
  // ...
}

// NEW CODE
import { EmailService } from "@/lib/email-service"

export async function POST(request: Request) {
  // ... parsing logic
  const emailService = EmailService.getInstance()
  await emailService.sendBookingConfirmation(bookingData)
  await emailService.sendStaffNotification(bookingData)
  // ...
}
```

### 2.3 Rename File Extension

```bash
# Rename .tsx to .ts (no JSX needed)
MoveFile: lib/email-service.tsx → lib/email-service.ts
```

### 2.4 Update All Imports

| File | Old Import | New Import |
|------|------------|------------|
| `app/api/send-booking-confirmation/route.ts` | `@/lib/email-service-setup` | `@/lib/email-service` |
| `app/api/send-booking-emails/route.ts` | `@/lib/email-service` | No change |
| `app/api/test-email/route.ts` | `@/lib/email-service` | No change |
| `app/api/webhooks/stripe/route.ts` | `@/lib/email-service` | No change |

### 2.5 Execution Commands

```bash
# Phase 2 Execution
UpdateFile: app/api/send-booking-confirmation/route.ts  # Update imports and usage
MoveFile: lib/email-service.tsx → lib/email-service.ts
```

---

## PHASE 3: EXTRACT BLOG DATA

**Priority:** MEDIUM  
**Risk:** LOW  
**Time:** 30 minutes  
**Dependencies:** None (can run parallel to Phase 2)

### 3.1 Current State

- `app/blog/page.tsx` is **2,100+ lines**
- Contains hardcoded `blogPosts` array (lines 25-1485)
- Mixes data with presentation

### 3.2 New File Structure

```
lib/
├── blog-data.ts          # NEW: Blog posts data + types
└── ...

app/blog/
├── page.tsx              # MODIFIED: Import from lib/blog-data.ts
└── ...
```

### 3.3 Create New File

**New File:** `lib/blog-data.ts`

```typescript
// Blog post types
export interface BlogPost {
  id: number
  title: string
  excerpt: string
  content: string
  category: string
  image: string
  author: string
  readTime: string
  featured?: boolean
  tags?: string[]
  publishedAt?: string
}

// Blog categories
export const BLOG_CATEGORIES = [
  "Training Tips",
  "Culture",
  "Nutrition", 
  "Fighter Stories",
  "Gym Life",
  "Events"
] as const

export type BlogCategory = typeof BLOG_CATEGORIES[number]

// Blog posts data
export const blogPosts: BlogPost[] = [
  // ... move all 10 blog posts here from app/blog/page.tsx
]

// Helper functions
export function getBlogPostById(id: number): BlogPost | undefined {
  return blogPosts.find(post => post.id === id)
}

export function getBlogPostsByCategory(category: string): BlogPost[] {
  return blogPosts.filter(post => post.category === category)
}

export function getFeaturedPosts(): BlogPost[] {
  return blogPosts.filter(post => post.featured)
}
```

### 3.4 Update Blog Page

**File:** `app/blog/page.tsx`

```typescript
// BEFORE (lines 24-1485)
const blogPosts = [
  { id: 1, title: "...", ... },
  // ... 1400+ lines of data
]

// AFTER
import { blogPosts, BlogPost, BLOG_CATEGORIES } from "@/lib/blog-data"

// Remove the entire blogPosts array definition
// Keep only the component logic
```

### 3.5 Line Count Impact

| File | Before | After | Reduction |
|------|--------|-------|-----------|
| `app/blog/page.tsx` | ~2,100 | ~600 | -71% |
| `lib/blog-data.ts` | 0 | ~1,500 | NEW |

### 3.6 Execution Commands

```bash
# Phase 3 Execution
CreateFile: lib/blog-data.ts  # New file with blog posts data
UpdateFile: app/blog/page.tsx  # Remove data, add import
```

---

## PHASE 4: SPLIT PAYMENT FLOW COMPONENT

**Priority:** MEDIUM  
**Risk:** MEDIUM  
**Time:** 45 minutes  
**Dependencies:** None

### 4.1 Current State

- `components/enhanced-payment-flow.tsx` is **909 lines**
- Contains multiple responsibilities:
  - Form steps (4 steps)
  - Stripe integration
  - State management
  - UI rendering

### 4.2 New File Structure

```
components/
├── payment/
│   ├── index.ts                    # Re-exports
│   ├── payment-flow.tsx            # Main orchestrator (reduced)
│   ├── step-service-select.tsx     # Step 1: Service selection
│   ├── step-date-time.tsx          # Step 2: Date/time picker
│   ├── step-customer-info.tsx      # Step 3: Customer form
│   ├── step-payment.tsx            # Step 4: Stripe payment
│   ├── payment-summary.tsx         # Order summary sidebar
│   └── types.ts                    # Shared types
└── enhanced-payment-flow.tsx       # KEEP (wrapper for backward compat)
```

### 4.3 Type Definitions

**New File:** `components/payment/types.ts`

```typescript
export interface BookingFormData {
  serviceId: string
  serviceName: string
  servicePrice: number
  date: Date | null
  time: string
  customerName: string
  customerEmail: string
  customerPhone: string
  specialRequests?: string
}

export interface PaymentStep {
  id: number
  name: string
  completed: boolean
}

export type PaymentMethod = "card" | "apple-pay" | "cash"
```

### 4.4 Component Extraction

**Step 1 Component:** `components/payment/step-service-select.tsx`
- Extract lines ~400-500 from enhanced-payment-flow.tsx
- Props: `services`, `selectedService`, `onSelect`

**Step 2 Component:** `components/payment/step-date-time.tsx`
- Extract lines ~500-650 from enhanced-payment-flow.tsx
- Props: `selectedDate`, `selectedTime`, `availableSlots`, `onDateChange`, `onTimeChange`

**Step 3 Component:** `components/payment/step-customer-info.tsx`
- Extract lines ~650-750 from enhanced-payment-flow.tsx
- Props: `formData`, `onChange`, `errors`

**Step 4 Component:** `components/payment/step-payment.tsx`
- Extract lines ~750-850 from enhanced-payment-flow.tsx
- Props: `amount`, `onPaymentComplete`, `onPayAtGym`

### 4.5 Backward Compatibility

**File:** `components/enhanced-payment-flow.tsx`

```typescript
// Keep this file as a re-export for backward compatibility
export { PaymentFlow as EnhancedPaymentFlow } from "./payment"
export { default } from "./payment"
```

### 4.6 Line Count Impact

| File | Before | After |
|------|--------|-------|
| `enhanced-payment-flow.tsx` | 909 | ~50 (re-export) |
| `payment/payment-flow.tsx` | 0 | ~250 |
| `payment/step-*.tsx` (4 files) | 0 | ~150 each |
| `payment/types.ts` | 0 | ~50 |

### 4.7 Risk Mitigation

- Keep original file as wrapper during transition
- Test each step component individually
- Update imports incrementally
- Rollback: Delete payment/ folder, restore original file

### 4.8 Execution Commands

```bash
# Phase 4 Execution
CreateFile: components/payment/types.ts
CreateFile: components/payment/step-service-select.tsx
CreateFile: components/payment/step-date-time.tsx
CreateFile: components/payment/step-customer-info.tsx
CreateFile: components/payment/step-payment.tsx
CreateFile: components/payment/payment-summary.tsx
CreateFile: components/payment/payment-flow.tsx
CreateFile: components/payment/index.ts
UpdateFile: components/enhanced-payment-flow.tsx  # Convert to re-export
```

---

## PHASE 5: ADD LOADING & ERROR BOUNDARIES

**Priority:** LOW  
**Risk:** LOW  
**Time:** 20 minutes  
**Dependencies:** None

### 5.1 Current State

| Route | Has loading.tsx | Has error.tsx |
|-------|-----------------|---------------|
| `/` | NO | NO |
| `/blog` | YES | NO |
| `/classes` | NO | NO |
| `/fighters` | NO | NO |
| `/contact` | NO | NO |
| `/booking-success` | NO | NO |

### 5.2 Routes Needing Loading States

**High Priority (data fetching):**
- `/classes` - Displays booking services
- `/booking-success` - Confirms payment

**Medium Priority (content heavy):**
- `/blog` - Already has loading.tsx
- `/fighters` - Static data, low priority

### 5.3 Template Files

**Template:** `loading.tsx`

```typescript
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a0a00] to-[#2d1810] p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <Skeleton className="h-12 w-3/4 bg-orange-900/20" />
        <Skeleton className="h-6 w-1/2 bg-orange-900/20" />
        <div className="grid gap-4">
          <Skeleton className="h-32 w-full bg-orange-900/20" />
          <Skeleton className="h-32 w-full bg-orange-900/20" />
          <Skeleton className="h-32 w-full bg-orange-900/20" />
        </div>
      </div>
    </div>
  )
}
```

**Template:** `error.tsx`

```typescript
"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[v0] Page error:", error)
  }, [error])

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a0a00] to-[#2d1810] flex items-center justify-center p-8">
      <div className="text-center space-y-6">
        <AlertTriangle className="h-16 w-16 text-orange-500 mx-auto" />
        <h2 className="text-2xl font-bold text-orange-100">Something went wrong</h2>
        <p className="text-orange-200/70 max-w-md">
          We encountered an error loading this page. Please try again.
        </p>
        <Button onClick={reset} variant="outline" className="border-orange-500 text-orange-500 bg-transparent">
          Try again
        </Button>
      </div>
    </div>
  )
}
```

### 5.4 Execution Commands

```bash
# Phase 5 Execution
CreateFile: app/classes/loading.tsx
CreateFile: app/classes/error.tsx
CreateFile: app/fighters/loading.tsx
CreateFile: app/fighters/error.tsx
CreateFile: app/booking-success/loading.tsx
CreateFile: app/booking-success/error.tsx
CreateFile: app/contact/loading.tsx
CreateFile: app/contact/error.tsx
```

---

## PHASE 6: ENVIRONMENT VARIABLE VALIDATION

**Priority:** LOW  
**Risk:** LOW  
**Time:** 15 minutes  
**Dependencies:** None

### 6.1 Current Environment Variables

| Variable | Required | Used In |
|----------|----------|---------|
| `STRIPE_SECRET_KEY` | YES | Payment processing |
| `STRIPE_PUBLISHABLE_KEY` | YES | Client-side Stripe |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | YES | Client-side Stripe |
| `STRIPE_WEBHOOK_SECRET` | YES | Webhook validation |
| `RESEND_API_KEY` | YES | Email sending |
| `STAFF_NOTIFICATION_EMAIL` | NO | Staff notifications |

### 6.2 Create Validation File

**New File:** `lib/env.ts`

```typescript
// Environment variable validation
// Validates required env vars at build/startup time

const requiredServerEnvVars = [
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET", 
  "RESEND_API_KEY",
] as const

const requiredClientEnvVars = [
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
] as const

const optionalEnvVars = [
  "STAFF_NOTIFICATION_EMAIL",
] as const

type ServerEnvVar = typeof requiredServerEnvVars[number]
type ClientEnvVar = typeof requiredClientEnvVars[number]

// Server-side validation
export function validateServerEnv(): void {
  const missing: string[] = []
  
  for (const envVar of requiredServerEnvVars) {
    if (!process.env[envVar]) {
      missing.push(envVar)
    }
  }
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${missing.map(v => `  - ${v}`).join('\n')}\n\nPlease add these to your Vercel project or .env.local file.`
    )
  }
}

// Get typed server env var
export function getServerEnv(key: ServerEnvVar): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value
}

// Get typed client env var
export function getClientEnv(key: ClientEnvVar): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value
}

// Get optional env var with default
export function getOptionalEnv(key: typeof optionalEnvVars[number], defaultValue: string): string {
  return process.env[key] || defaultValue
}

// Export typed env object for convenience
export const env = {
  stripe: {
    secretKey: () => getServerEnv("STRIPE_SECRET_KEY"),
    publishableKey: () => getClientEnv("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"),
    webhookSecret: () => getServerEnv("STRIPE_WEBHOOK_SECRET"),
  },
  resend: {
    apiKey: () => getServerEnv("RESEND_API_KEY"),
  },
  notifications: {
    staffEmail: () => getOptionalEnv("STAFF_NOTIFICATION_EMAIL", "info@paimuaythai.com"),
  },
} as const
```

### 6.3 Usage Example

```typescript
// In API routes
import { env, validateServerEnv } from "@/lib/env"

// Validate at startup
validateServerEnv()

// Use typed accessors
const stripe = new Stripe(env.stripe.secretKey(), { ... })
const staffEmail = env.notifications.staffEmail()
```

### 6.4 Execution Commands

```bash
# Phase 6 Execution
CreateFile: lib/env.ts
UpdateFile: app/api/create-payment-intent/route.ts  # Use env helpers
UpdateFile: app/api/webhooks/stripe/route.ts  # Use env helpers
UpdateFile: lib/email-service.ts  # Use env helpers
```

---

## PHASE 7: LONG-TERM ARCHITECTURE ROADMAP

**Priority:** PLANNING  
**Risk:** N/A  
**Time:** N/A

### 7.1 Blog System Evolution

**Current State:**
- Static data in `app/blog/page.tsx`
- No CMS integration
- No dynamic routes

**Phase A: Data Extraction (This Plan)**
```
lib/blog-data.ts → Static blog posts
app/blog/page.tsx → Import from lib
```

**Phase B: Dynamic Routes (Future)**
```
app/blog/
├── page.tsx           # List view
├── [slug]/
│   └── page.tsx       # Individual post
└── category/
    └── [category]/
        └── page.tsx   # Category filter
```

**Phase C: CMS Integration (Future)**
```
Option 1: Headless CMS (Sanity, Contentful)
Option 2: Database (Supabase with admin UI)
Option 3: MDX files (for developer-friendly editing)
```

### 7.2 Booking/Payments System Evolution

**Current State:**
- Stripe integration working
- Simple service selection
- No user accounts

**Phase A: Component Refactor (This Plan)**
```
components/payment/
├── step-*.tsx         # Modular steps
├── payment-flow.tsx   # Orchestrator
└── types.ts           # Shared types
```

**Phase B: Database Integration (Future)**
```
Supabase tables:
├── bookings           # All bookings
├── customers          # Customer data
├── services           # Service catalog
└── payments           # Payment records

Benefits:
- Track all bookings
- Customer history
- Revenue reporting
- 20% commission calculation
```

**Phase C: Admin Dashboard (Future)**
```
app/admin/
├── page.tsx           # Dashboard overview
├── bookings/
│   └── page.tsx       # Booking management
├── customers/
│   └── page.tsx       # Customer list
└── revenue/
    └── page.tsx       # Revenue reports
```

### 7.3 Future Subscription/Auth System

**Phase A: Basic Auth**
```
Components:
- Supabase Auth integration
- Login/Register pages
- Protected routes middleware

Routes:
app/
├── login/page.tsx      # Already exists
├── register/page.tsx   # NEW
├── profile/page.tsx    # NEW
└── dashboard/page.tsx  # NEW (student dashboard)
```

**Phase B: Subscription Tiers**
```
Tiers:
├── Free              # View content only
├── Student           # Book classes, access materials
├── Premium           # Unlimited classes, video library
└── Fighter           # Competition prep, 1:1 coaching
```

**Phase C: Payment Integration**
```
Stripe Products:
├── One-time (current) # Single class bookings
├── Subscription       # Monthly membership
└── Package deals      # 10-class passes
```

### 7.4 Future Certification System

**Phase A: Basic Structure**
```
app/certifications/
├── page.tsx           # Program overview
├── [level]/
│   └── page.tsx       # Level details
└── progress/
    └── page.tsx       # Student progress (auth required)

lib/certifications/
├── levels.ts          # Certification levels data
├── requirements.ts    # Requirements per level
└── progress.ts        # Progress tracking utils
```

**Phase B: Database Schema**
```
Supabase tables:
├── certification_levels     # Level definitions
├── certification_requirements # What's needed per level
├── student_progress        # Tracking per student
├── certificates            # Issued certificates
└── assessments             # Tests/evaluations
```

**Phase C: Features**
```
- Progress tracking dashboard
- Skill assessments
- Certificate generation (PDF)
- Instructor sign-off workflow
- Public verification page
```

### 7.5 Architecture Direction Summary

```
CURRENT (2024)
└── Static site with Stripe payments

NEAR-TERM (Q1 2025)
├── Supabase integration
├── Customer database
├── Booking tracking
└── Basic admin dashboard

MID-TERM (Q2-Q3 2025)
├── User authentication
├── Student dashboard
├── Video content library
└── Certification tracking

LONG-TERM (Q4 2025+)
├── Subscription billing
├── Mobile app (React Native)
├── Multi-gym support
└── Instructor marketplace
```

---

## TOP 5 FRAGILE/LARGE COMPONENTS

### 1. `app/blog/page.tsx` (2,100+ LOC)

**Issues:**
- Data mixed with UI
- Massive single file
- Hard to maintain

**Solution:** Phase 3 - Extract blog data

### 2. `components/enhanced-payment-flow.tsx` (909 LOC)

**Issues:**
- Multiple responsibilities
- Hard to test individual steps
- State management complexity

**Solution:** Phase 4 - Split into step components

### 3. `app/client.tsx` (700 LOC)

**Issues:**
- Homepage logic in single file
- Animation state complexity
- Multiple sections combined

**Solution (Future):**
```
app/
├── client.tsx → Orchestrator only (~200 LOC)
└── components/home/
    ├── hero-section.tsx
    ├── services-section.tsx
    ├── testimonials-section.tsx
    └── cta-section.tsx
```

### 4. `app/login/page.tsx` (Large)

**Issues:**
- Mock authentication
- UI-heavy
- No real auth integration

**Solution (Future):**
- Integrate Supabase Auth
- Split into components
- Add proper session management

### 5. `app/education-visas/page.tsx`

**Issues:**
- Heavy content page
- Complex form logic
- Multiple state variables

**Solution (Future):**
- Extract form to separate component
- Add form validation library (zod + react-hook-form)
- Consider multi-step form pattern

---

## RSC/CLIENT BOUNDARY ANALYSIS

### Current Violations

| File | Issue | Fix |
|------|-------|-----|
| `lib/email-service-setup.tsx` | Has `"use client"` but only exports server functions | Remove directive, delete file (Phase 1) |
| `app/api/send-booking-confirmation/route.ts` | Imports from client file | Update import (Phase 2) |

### Recommended Patterns

**Server Components (default):**
- Data fetching
- API route handlers
- Database queries
- Static content pages

**Client Components (`"use client"`):**
- Interactive forms
- State-dependent UI
- Browser APIs (localStorage, etc.)
- Event handlers

### Files Needing Review

| File | Current | Should Be | Action |
|------|---------|-----------|--------|
| `lib/email-service.tsx` | No directive | Server only | Rename to `.ts` |
| `lib/booking-config.ts` | No directive | Shared | OK |
| `lib/fighters-data.ts` | No directive | Shared | OK |

---

## EXECUTION CHECKLIST

### Pre-Flight
- [ ] Backup current state (git commit)
- [ ] Review all changes in this document
- [ ] Confirm no active deployments

### Phase 1: Delete Duplicates
- [ ] Delete `components/ui/use-mobile.tsx`
- [ ] Update `app/api/send-booking-confirmation/route.ts`
- [ ] Delete `lib/email-service-setup.tsx`
- [ ] Delete `app/classes/page-client.tsx`
- [ ] Verify no broken imports

### Phase 2: Consolidate Email
- [ ] Rename `lib/email-service.tsx` → `lib/email-service.ts`
- [ ] Verify all email routes work
- [ ] Test booking confirmation flow

### Phase 3: Extract Blog Data
- [ ] Create `lib/blog-data.ts`
- [ ] Update `app/blog/page.tsx`
- [ ] Verify blog page renders correctly

### Phase 4: Split Payment Flow
- [ ] Create `components/payment/` directory
- [ ] Create type definitions
- [ ] Extract step components
- [ ] Update main orchestrator
- [ ] Test full payment flow

### Phase 5: Add Loading/Error
- [ ] Add loading.tsx to key routes
- [ ] Add error.tsx to key routes
- [ ] Test error boundaries

### Phase 6: Env Validation
- [ ] Create `lib/env.ts`
- [ ] Update API routes to use typed env
- [ ] Test with missing env vars

### Post-Execution
- [ ] Run full test of booking flow
- [ ] Verify all pages load
- [ ] Check for console errors
- [ ] Deploy to preview environment
- [ ] Final production deploy

---

## APPENDIX: QUICK REFERENCE

### Files Created
- `lib/blog-data.ts`
- `lib/env.ts`
- `components/payment/types.ts`
- `components/payment/step-service-select.tsx`
- `components/payment/step-date-time.tsx`
- `components/payment/step-customer-info.tsx`
- `components/payment/step-payment.tsx`
- `components/payment/payment-summary.tsx`
- `components/payment/payment-flow.tsx`
- `components/payment/index.ts`
- `app/classes/loading.tsx`
- `app/classes/error.tsx`
- `app/fighters/loading.tsx`
- `app/fighters/error.tsx`
- `app/booking-success/loading.tsx`
- `app/booking-success/error.tsx`
- `app/contact/loading.tsx`
- `app/contact/error.tsx`

### Files Deleted
- `components/ui/use-mobile.tsx`
- `lib/email-service-setup.tsx`
- `app/classes/page-client.tsx`

### Files Renamed
- `lib/email-service.tsx` → `lib/email-service.ts`

### Files Modified
- `app/api/send-booking-confirmation/route.ts`
- `app/blog/page.tsx`
- `components/enhanced-payment-flow.tsx`
- `app/api/create-payment-intent/route.ts`
- `app/api/webhooks/stripe/route.ts`

---

**END OF EXECUTION PLAN**

*Ready for automatic editing. Execute phases sequentially.*
