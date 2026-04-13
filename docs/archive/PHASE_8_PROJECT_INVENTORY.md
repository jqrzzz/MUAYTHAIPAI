# PHASE 8: PROJECT INVENTORY REPORT

**Generated:** December 2024  
**Project:** Pai Muay Thai  
**Framework:** Next.js 14.0.0 (App Router)

---

## 1. CURRENT FILE STRUCTURE

### /app (Routes & Pages)

```
app/
├── layout.tsx                          # Root layout (RSC)
├── page.tsx                            # Homepage (RSC wrapper)
├── client.tsx                          # Homepage client component
├── page-client.tsx                     # DEAD CODE - orphaned file
├── globals.css                         # Global styles
│
├── api/
│   ├── create-payment-intent/
│   │   └── route.ts                    # Stripe PaymentIntent creation
│   ├── send-booking-confirmation/
│   │   └── route.ts                    # Email confirmation sender
│   ├── send-booking-emails/
│   │   └── route.ts                    # Dual email sender (customer + staff)
│   ├── test-email/
│   │   └── route.ts                    # Email testing endpoint
│   └── webhooks/
│       └── stripe/
│           └── route.ts                # Stripe webhook handler
│
├── apprenticeship/
│   └── page.tsx                        # Apprenticeship info (CLIENT)
│
├── blog/
│   ├── layout.tsx                      # Blog layout (RSC)
│   ├── loading.tsx                     # Blog skeleton loader
│   └── page.tsx                        # Blog listing (CLIENT, 650+ lines)
│
├── booking-success/
│   ├── error.tsx                       # Error boundary (CLIENT)
│   ├── loading.tsx                     # Skeleton loader
│   └── page.tsx                        # Success confirmation (RSC)
│
├── careers/
│   ├── layout.tsx                      # Careers layout (RSC)
│   └── page.tsx                        # Job listings (CLIENT)
│
├── certificate-programs/
│   ├── client.tsx                      # Client component
│   └── page.tsx                        # Programs page (RSC wrapper)
│
├── classes/
│   ├── client.tsx                      # Client component
│   ├── error.tsx                       # Error boundary (CLIENT)
│   ├── loading.tsx                     # Skeleton loader
│   └── page.tsx                        # Classes page (RSC wrapper)
│
├── contact/
│   ├── error.tsx                       # Error boundary (CLIENT)
│   ├── layout.tsx                      # Contact layout (RSC)
│   ├── loading.tsx                     # Skeleton loader
│   └── page.tsx                        # Contact form (CLIENT)
│
├── education-visas/
│   └── page.tsx                        # Visa info (CLIENT)
│
├── faq/
│   └── page.tsx                        # FAQ accordion (CLIENT)
│
├── fighters/
│   ├── client.tsx                      # Fighters grid (CLIENT)
│   ├── error.tsx                       # Error boundary (CLIENT)
│   ├── loading.tsx                     # Skeleton loader
│   └── page.tsx                        # Fighters page (RSC wrapper)
│
├── gym/
│   ├── client.tsx                      # Gym tour (CLIENT)
│   └── page.tsx                        # Gym page (RSC wrapper)
│
├── login/
│   └── page.tsx                        # Login form (CLIENT)
│
├── pai-thailand/
│   └── page.tsx                        # Location info (CLIENT)
│
├── privacy-policy/
│   └── page.tsx                        # Legal page (RSC)
│
├── terms-conditions/
│   └── page.tsx                        # Legal page (RSC)
│
└── train-and-stay/
    ├── client.tsx                      # Packages display (CLIENT)
    └── page.tsx                        # Train & stay (RSC wrapper)
```

### /components

```
components/
├── booking-progress-indicator.tsx      # Step indicator (CLIENT)
├── booking-section.tsx                 # Main booking UI (CLIENT)
├── calendly-integration.tsx            # Calendly embed (CLIENT)
├── calendly-popup.tsx                  # Calendly modal (CLIENT)
├── enhanced-payment-flow.tsx           # Re-export wrapper (CLIENT, 3 lines)
├── gym-location.tsx                    # Map embed (CLIENT)
├── legal-compliance.tsx                # Cookie consent (CLIENT)
├── mini-slideshow.tsx                  # Image carousel (CLIENT)
├── mode-toggle.tsx                     # Theme switcher (CLIENT)
├── more-menu.tsx                       # Dropdown menu (CLIENT)
├── payment-options.tsx                 # Payment selector (CLIENT)
├── sacred-background.tsx               # Decorative SVG (CLIENT)
├── site-footer-menu.tsx                # Footer nav (CLIENT)
├── site-header.tsx                     # Header/nav (CLIENT)
├── student-highlights.tsx              # Testimonials (CLIENT)
├── theme-provider.tsx                  # Theme context (CLIENT)
│
├── payment/                            # Payment flow modules
│   ├── index.ts                        # Barrel export
│   ├── payment-flow.tsx                # Main orchestrator (CLIENT)
│   ├── payment-summary.tsx             # Order summary (CLIENT)
│   ├── step-customer-info.tsx          # Form step 1 (CLIENT)
│   ├── step-date-time.tsx              # Form step 2 (CLIENT)
│   ├── step-payment.tsx                # Form step 3 (CLIENT)
│   ├── step-success.tsx                # Form step 4 (CLIENT)
│   └── types.ts                        # Shared interfaces
│
└── ui/                                 # shadcn/ui components (39 files)
    ├── accordion.tsx
    ├── alert-dialog.tsx
    ├── alert.tsx
    ├── aspect-ratio.tsx
    ├── avatar.tsx
    ├── badge.tsx
    ├── breadcrumb.tsx
    ├── button.tsx
    ├── calendar.tsx
    ├── card.tsx
    ├── carousel.tsx
    ├── chart.tsx
    ├── checkbox.tsx
    ├── collapsible.tsx
    ├── command.tsx
    ├── context-menu.tsx
    ├── dialog.tsx
    ├── drawer.tsx
    ├── dropdown-menu.tsx
    ├── field.tsx
    ├── form.tsx
    ├── hover-card.tsx
    ├── input-group.tsx
    ├── input-otp.tsx
    ├── input.tsx
    ├── label.tsx
    ├── menubar.tsx
    ├── navigation-menu.tsx
    ├── popover.tsx
    ├── progress.tsx
    ├── radio-group.tsx
    ├── resizable.tsx
    ├── scroll-area.tsx
    ├── select.tsx
    ├── separator.tsx
    ├── sheet.tsx
    ├── sidebar.tsx
    ├── skeleton.tsx
    ├── slider.tsx
    ├── sonner.tsx
    ├── switch.tsx
    ├── table.tsx
    ├── tabs.tsx
    ├── textarea.tsx
    ├── toast.tsx
    ├── toaster.tsx
    ├── toggle-group.tsx
    ├── toggle.tsx
    ├── tooltip.tsx
    └── use-toast.ts
```

### /lib

```
lib/
├── blog-data.ts                        # Blog posts array + helpers (~2200 lines)
├── booking-api.ts                      # Booking validation & submission
├── booking-config.ts                   # Time slots, services, skill levels
├── email-service.tsx                   # Resend email service class
├── env.ts                              # Environment variable validation
├── fighters-data.ts                    # Fighter profiles array
├── payment-api.ts                      # Payment intent helpers
├── payment-config.ts                   # Pricing & currency config
├── stripe-config.ts                    # Stripe configuration
└── utils.ts                            # cn() utility function
```

### /hooks

```
hooks/
├── use-mobile.tsx                      # Mobile detection hook
└── use-toast.ts                        # Toast notification hook
```

### /public

```
public/
├── images/
│   ├── certificates/                   # Certificate badge images
│   ├── fighters/                       # Fighter profile photos
│   ├── gym/                            # Gym facility photos
│   └── levels/                         # Skill level badges
├── favicon.ico
└── placeholder.svg
```

### /docs

```
docs/
├── PROJECT_OVERVIEW.md                 # High-level project description
├── BOOKING_SYSTEM.md                   # Booking flow documentation
├── PAYMENT_SYSTEM.md                   # Payment integration docs
├── EMAIL_SYSTEM.md                     # Email service documentation
├── DESIGN_SYSTEM.md                    # UI/UX guidelines
├── DIAGNOSTIC_REPORT.md                # Initial code audit
├── COMPLETE_ARCHITECTURE_MAP.md        # Full architecture documentation
├── REFACTOR_EXECUTION_PLAN.md          # Multi-phase refactor plan
├── PHASE_7_ARCHITECTURE_ROADMAP.md     # Future architecture roadmap
└── PHASE_8_PROJECT_INVENTORY.md        # This file
```

### Root Files

```
/
├── .env.example                        # Environment template
├── .env.local                          # Local environment (gitignored)
├── middleware.ts                       # Route middleware
├── next.config.mjs                     # Next.js configuration
├── package.json                        # Dependencies
├── tailwind.config.ts                  # Tailwind configuration
├── tsconfig.json                       # TypeScript configuration
├── STRIPE_SETUP.md                     # Stripe setup guide
├── UX_SETUP_CHECKLIST.md               # UX implementation checklist
└── WEBHOOK_SETUP_GUIDE.md              # Webhook configuration guide
```

---

## 2. CURRENT API SURFACE

| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/create-payment-intent` | POST | Creates Stripe PaymentIntent with THB amount, customer metadata, and booking details. Returns clientSecret for frontend. |
| `/api/send-booking-confirmation` | POST | Sends booking confirmation emails to customer and staff notification using Resend. Used for cash payment bookings. |
| `/api/send-booking-emails` | POST | Dual-purpose email sender that sends both customer confirmation and staff notification in a single request. |
| `/api/test-email` | GET, POST | Testing endpoint to verify email configuration. GET sends test emails, POST allows custom test data. |
| `/api/webhooks/stripe` | GET, POST | Handles Stripe webhook events (payment_intent.succeeded, payment_intent.payment_failed). GET returns health check. |

---

## 3. CLIENT VS SERVER COMPONENTS

### Client Components ("use client")

**App Pages (19):**
| File | Reason for Client |
|------|-------------------|
| `app/apprenticeship/page.tsx` | useState, useEffect for animations |
| `app/blog/page.tsx` | useState for filtering, search |
| `app/careers/page.tsx` | useState, useEffect for animations |
| `app/certificate-programs/client.tsx` | Interactive UI |
| `app/classes/client.tsx` | Interactive booking |
| `app/client.tsx` | Homepage interactivity |
| `app/contact/page.tsx` | Form state management |
| `app/education-visas/page.tsx` | Interactive FAQ |
| `app/faq/page.tsx` | Accordion state |
| `app/fighters/client.tsx` | Filter/sort state |
| `app/gym/client.tsx` | Image gallery state |
| `app/login/page.tsx` | Form state |
| `app/pai-thailand/page.tsx` | Interactive map |
| `app/train-and-stay/client.tsx` | Package selector state |
| `app/booking-success/error.tsx` | Error boundary |
| `app/classes/error.tsx` | Error boundary |
| `app/contact/error.tsx` | Error boundary |
| `app/fighters/error.tsx` | Error boundary |
| `app/page-client.tsx` | **DEAD CODE** |

**Feature Components (14):**
| File | Purpose |
|------|---------|
| `components/booking-progress-indicator.tsx` | Step visualization |
| `components/booking-section.tsx` | Main booking form |
| `components/calendly-integration.tsx` | External embed |
| `components/calendly-popup.tsx` | Modal with external content |
| `components/enhanced-payment-flow.tsx` | Re-export wrapper |
| `components/gym-location.tsx` | Map embed |
| `components/legal-compliance.tsx` | Cookie consent |
| `components/mini-slideshow.tsx` | Image carousel |
| `components/mode-toggle.tsx` | Theme switcher |
| `components/more-menu.tsx` | Dropdown menu |
| `components/payment-options.tsx` | Payment method selector |
| `components/sacred-background.tsx` | SVG animation |
| `components/site-footer-menu.tsx` | Accordion navigation |
| `components/site-header.tsx` | Navigation with mobile menu |
| `components/student-highlights.tsx` | Carousel |
| `components/theme-provider.tsx` | Context provider |

**Payment Module Components (6):**
| File | Purpose |
|------|---------|
| `components/payment/payment-flow.tsx` | Main orchestrator |
| `components/payment/payment-summary.tsx` | Order summary |
| `components/payment/step-customer-info.tsx` | Form step |
| `components/payment/step-date-time.tsx` | Form step |
| `components/payment/step-payment.tsx` | Payment form |
| `components/payment/step-success.tsx` | Confirmation |

**UI Components (36 client):**
All shadcn/ui components that use Radix primitives are client components.

### Server Components (RSC)

| File | Type |
|------|------|
| `app/layout.tsx` | Root layout |
| `app/page.tsx` | Homepage wrapper |
| `app/blog/layout.tsx` | Section layout |
| `app/careers/layout.tsx` | Section layout |
| `app/contact/layout.tsx` | Section layout |
| `app/certificate-programs/page.tsx` | Page wrapper |
| `app/classes/page.tsx` | Page wrapper |
| `app/fighters/page.tsx` | Page wrapper |
| `app/gym/page.tsx` | Page wrapper |
| `app/train-and-stay/page.tsx` | Page wrapper |
| `app/booking-success/page.tsx` | Static page |
| `app/privacy-policy/page.tsx` | Static page |
| `app/terms-conditions/page.tsx` | Static page |
| `app/blog/loading.tsx` | Suspense fallback |
| `app/booking-success/loading.tsx` | Suspense fallback |
| `app/classes/loading.tsx` | Suspense fallback |
| `app/contact/loading.tsx` | Suspense fallback |
| `app/fighters/loading.tsx` | Suspense fallback |

### Inconsistencies Detected

| Issue | Files | Severity |
|-------|-------|----------|
| Inline "use client" in page.tsx | 8 pages | MEDIUM - Should use client.tsx pattern |
| Dead orphan file | `app/page-client.tsx` | LOW - Should delete |
| Mixed patterns | Some pages use RSC wrapper + client.tsx, others are fully client | LOW - Inconsistent but functional |

---

## 4. CURRENT DATA SOURCES

### Static Data Files

| File | Data Type | Size | Used By |
|------|-----------|------|---------|
| `lib/blog-data.ts` | Blog posts array | ~2200 lines, 14 posts | `app/blog/page.tsx` |
| `lib/fighters-data.ts` | Fighter profiles | ~200 lines, 8 fighters | `app/fighters/client.tsx` |
| `lib/booking-config.ts` | Time slots, services, skill levels | ~160 lines | Booking components |
| `lib/payment-config.ts` | Pricing, currency | ~50 lines | Payment components |

### Hard-Coded Data in Components

| File | Data Type | Lines | Recommendation |
|------|-----------|-------|----------------|
| `app/faq/page.tsx` | FAQ items array | ~130 lines | Extract to `lib/faq-data.ts` |
| `app/education-visas/page.tsx` | Visa info, requirements | ~80 lines | Extract to `lib/visa-data.ts` |
| `app/apprenticeship/page.tsx` | Program details | ~100 lines | Extract to `lib/programs-data.ts` |
| `app/careers/page.tsx` | Job listings | ~80 lines | Extract to `lib/careers-data.ts` |
| `app/pai-thailand/page.tsx` | Location info, activities | ~100 lines | Extract to `lib/location-data.ts` |
| `app/certificate-programs/client.tsx` | Certificate levels | ~150 lines | Extract to `lib/certificates-data.ts` |
| `app/train-and-stay/client.tsx` | Accommodation packages | ~100 lines | Extract to `lib/packages-data.ts` |
| `components/student-highlights.tsx` | Testimonials | ~50 lines | Extract to `lib/testimonials-data.ts` |

**Total Hard-Coded Data:** ~790 lines across 8 files

---

## 5. CURRENT DEPENDENCIES

### Core Framework

| Package | Version | Role |
|---------|---------|------|
| `next` | 14.0.0 | React framework |
| `react` | ^18 | UI library |
| `react-dom` | ^18 | React DOM renderer |
| `typescript` | ^5 | Type safety |

### UI & Styling

| Package | Version | Role |
|---------|---------|------|
| `tailwindcss` | ^3.4.17 | Utility CSS |
| `tailwindcss-animate` | 1.0.7 | Animation utilities |
| `class-variance-authority` | 0.7.1 | Variant styling |
| `clsx` | 2.1.1 | Class merging |
| `tailwind-merge` | 3.3.1 | Tailwind class deduplication |
| `lucide-react` | ^0.294.0 | Icon library |
| `framer-motion` | ^10.16.0 | Animations |

### shadcn/ui Dependencies (Radix)

| Package | Role |
|---------|------|
| `@radix-ui/react-accordion` | Accordion primitive |
| `@radix-ui/react-alert-dialog` | Alert dialog primitive |
| `@radix-ui/react-dialog` | Dialog primitive |
| `@radix-ui/react-dropdown-menu` | Dropdown primitive |
| `@radix-ui/react-popover` | Popover primitive |
| `@radix-ui/react-select` | Select primitive |
| `@radix-ui/react-tabs` | Tabs primitive |
| `@radix-ui/react-toast` | Toast primitive |
| ... | (16 more Radix packages) |

### Payment & Email

| Package | Version | Role |
|---------|---------|------|
| `stripe` | 18.5.0 | Stripe Node.js SDK |
| `@stripe/stripe-js` | 7.9.0 | Stripe browser SDK |
| `@stripe/react-stripe-js` | 4.0.2 | Stripe React components |
| `resend` | 6.1.0 | Email API |

### Utilities

| Package | Version | Role |
|---------|---------|------|
| `date-fns` | 4.1.0 | Date manipulation |
| `react-day-picker` | ^8.10.0 | Calendar component |
| `react-hook-form` | ^7.49.0 | Form management |
| `recharts` | ^2.10.0 | Charts |
| `cmdk` | ^0.2.0 | Command palette |
| `vaul` | ^0.9.0 | Drawer component |
| `sonner` | ^1.3.0 | Toast notifications |
| `embla-carousel-react` | ^8.0.0 | Carousel |
| `input-otp` | ^1.2.0 | OTP input |
| `next-themes` | 0.4.6 | Theme management |

### Analytics

| Package | Version | Role |
|---------|---------|------|
| `@vercel/analytics` | ^1.0.0 | Vercel Analytics |
| `@vercel/speed-insights` | ^1.0.0 | Performance monitoring |

### Potentially Unused/Redundant

| Package | Concern |
|---------|---------|
| `@emailjs/browser` | May be unused (Resend is primary) |
| `antd` | Heavy UI library, only partial use detected |
| `react-router-dom` | Not needed with Next.js App Router |

---

## 6. TECHNICAL WEAK POINTS

### Critical Issues

| Issue | Location | Impact | Phase 7 Conflict |
|-------|----------|--------|------------------|
| No database | Entire app | All data is static, no persistence | Blocks user accounts, booking history |
| No authentication | `app/login/page.tsx` | Login UI exists but no auth backend | Blocks protected routes |
| Hard-coded data | 8+ files | Content updates require code deployment | Blocks CMS integration |

### High Priority Issues

| Issue | Location | Impact |
|-------|----------|--------|
| Dead code | `app/page-client.tsx` | Orphan file, causes confusion |
| Duplicate hook file | `components/ui/use-toast.ts` vs `hooks/use-toast.ts` | Potential import confusion |
| Missing loading states | 10 routes without loading.tsx | Poor UX during navigation |
| Missing error boundaries | 10 routes without error.tsx | Unhandled errors crash page |
| Large blog file | `lib/blog-data.ts` (~2200 lines) | Hard to maintain |

### Medium Priority Issues

| Issue | Location | Impact |
|-------|----------|--------|
| Inconsistent client patterns | 8 inline client pages | Code style inconsistency |
| .tsx extension for non-JSX | `lib/email-service.tsx` | Should be .ts |
| Mixed quote styles | Throughout codebase | "use client" vs 'use client' |
| No input validation schemas | Forms | Type safety gaps |
| No API response typing | API routes | Type safety gaps |

### Low Priority Issues

| Issue | Location | Impact |
|-------|----------|--------|
| Unused dependencies | `package.json` | Bundle size |
| No unit tests | Entire app | No test coverage |
| No E2E tests | Entire app | No integration testing |
| Inconsistent file naming | Some kebab-case, some camelCase | Style inconsistency |

### Phase 7 Architecture Conflicts

| Current State | Phase 7 Requirement | Migration Effort |
|---------------|---------------------|------------------|
| Static data files | Database tables | HIGH - Full data migration |
| No auth | Supabase Auth | HIGH - New auth flow |
| Client-side forms | Server Actions | MEDIUM - Refactor forms |
| Direct Stripe calls | Edge middleware validation | LOW - Add middleware |
| Manual emails | Queued email system | MEDIUM - Add job queue |
| No caching | Redis/CDN caching | MEDIUM - Add caching layer |
| Single language | i18n support | HIGH - Extract all strings |

---

## 7. SUMMARY STATISTICS

### File Counts

| Category | Count |
|----------|-------|
| Total Pages | 15 |
| Total Layouts | 4 |
| Total Loading States | 5 |
| Total Error Boundaries | 4 |
| Total API Routes | 5 |
| Feature Components | 16 |
| Payment Module Files | 8 |
| UI Components (shadcn) | 39 |
| Lib Files | 10 |
| Hook Files | 2 |
| Documentation Files | 10 |

### Code Distribution

| Type | Approximate Lines |
|------|-------------------|
| Static Data | ~3,500 |
| UI Components | ~5,000 |
| Page Components | ~4,000 |
| Lib/Utilities | ~1,500 |
| API Routes | ~500 |
| Documentation | ~3,000 |
| **Total** | **~17,500** |

### Client vs Server Ratio

| Type | Count | Percentage |
|------|-------|------------|
| Client Components | ~60 | 75% |
| Server Components | ~18 | 22.5% |
| Shared/Utils | ~2 | 2.5% |

---

## 8. RECOMMENDED IMMEDIATE ACTIONS

1. **Delete dead code:** `app/page-client.tsx`
2. **Rename file extension:** `lib/email-service.tsx` → `lib/email-service.ts`
3. **Add missing loading/error:** 10 routes need these files
4. **Audit unused packages:** Remove `react-router-dom`, evaluate `antd` and `@emailjs/browser`
5. **Extract remaining hard-coded data:** 8 files with ~790 lines of inline data

---

**Report Complete**
