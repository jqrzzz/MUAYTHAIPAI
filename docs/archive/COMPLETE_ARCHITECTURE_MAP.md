# Muay Thai Pai - Complete Architecture Map & Diagnostic Report

**Generated:** December 2024  
**Project:** Muay Thai Pai Booking & Training Platform  
**Tech Stack:** Next.js 14 (App Router), React, TypeScript, Tailwind CSS, Stripe, Resend

---

## Executive Summary

The Muay Thai Pai project is a full-stack Next.js application serving as a booking and information platform for a traditional Muay Thai gym in Pai, Thailand. The system handles online bookings, payments via Stripe, email notifications via Resend, and provides comprehensive information about training programs, fighters, and cultural experiences.

**Key Statistics:**
- **Total Files:** ~120+ files
- **Lines of Code:** ~15,000+ LOC
- **Pages/Routes:** 15+ public pages
- **API Endpoints:** 5 endpoints
- **Components:** 25+ custom components
- **Integration Points:** Stripe (payments), Resend (emails)

---

## 1. Complete File Tree with Component Types

```
muay-thai-pai/
├── app/                                    # Next.js App Router
│   ├── layout.tsx                          # RSC - Root layout with metadata
│   ├── page.tsx                            # RSC - Homepage wrapper
│   ├── client.tsx                          # CLIENT - Main homepage (700 LOC)
│   │
│   ├── api/                                # API Routes (Server-side)
│   │   ├── create-payment-intent/
│   │   │   └── route.ts                    # SERVER - Stripe payment intent creation
│   │   ├── send-booking-confirmation/
│   │   │   └── route.ts                    # SERVER - Send confirmation emails
│   │   ├── send-booking-emails/
│   │   │   └── route.ts                    # SERVER - Send booking emails
│   │   ├── test-email/
│   │   │   └── route.ts                    # SERVER - Email testing endpoint
│   │   └── webhooks/stripe/
│   │       └── route.ts                    # SERVER - Stripe webhook handler
│   │
│   ├── apprenticeship/
│   │   └── page.tsx                        # CLIENT - Apprenticeship program info
│   ├── blog/
│   │   ├── layout.tsx                      # RSC - Blog layout
│   │   ├── loading.tsx                     # RSC - Loading state
│   │   └── page.tsx                        # CLIENT - Blog posts (2100+ LOC) ⚠️ LARGE
│   ├── booking-success/
│   │   └── page.tsx                        # CLIENT - Booking confirmation page
│   ├── careers/
│   │   ├── layout.tsx                      # RSC - Careers layout
│   │   └── page.tsx                        # CLIENT - Career opportunities
│   ├── certificate-programs/
│   │   ├── client.tsx                      # CLIENT - Certificate programs
│   │   └── page.tsx                        # RSC - Certificate wrapper
│   ├── classes/
│   │   ├── client.tsx                      # CLIENT - Classes page (new naming)
│   │   ├── page-client.tsx                 # CLIENT - Classes page (old file) ⚠️ DUPLICATE
│   │   └── page.tsx                        # RSC - Classes wrapper
│   ├── contact/
│   │   ├── layout.tsx                      # RSC - Contact layout
│   │   └── page.tsx                        # CLIENT - Contact form
│   ├── education-visas/
│   │   └── page.tsx                        # CLIENT - Education visa info
│   ├── faq/
│   │   └── page.tsx                        # CLIENT - FAQ page
│   ├── fighters/
│   │   ├── client.tsx                      # CLIENT - Fighters showcase
│   │   └── page.tsx                        # RSC - Fighters wrapper
│   ├── gym/
│   │   ├── client.tsx                      # CLIENT - Gym details
│   │   └── page.tsx                        # RSC - Gym wrapper
│   ├── login/
│   │   └── page.tsx                        # CLIENT - Login page (future auth)
│   ├── pai-thailand/
│   │   └── page.tsx                        # CLIENT - Pai destination info
│   ├── privacy-policy/
│   │   └── page.tsx                        # RSC - Privacy policy
│   ├── terms-conditions/
│   │   └── page.tsx                        # RSC - Terms and conditions
│   ├── train-and-stay/
│   │   ├── client.tsx                      # CLIENT - Training packages
│   │   └── page.tsx                        # RSC - Train and stay wrapper
│   │
│   └── globals.css                         # Global styles (Tailwind + shadcn)
│
├── components/                             # React Components
│   ├── booking-progress-indicator.tsx     # CLIENT - Booking step indicator
│   ├── booking-section.tsx                # CLIENT - Main booking interface
│   ├── calendly-integration.tsx           # CLIENT - Calendly scheduling
│   ├── calendly-popup.tsx                 # CLIENT - Calendly modal
│   ├── enhanced-payment-flow.tsx          # CLIENT - Payment flow (900+ LOC) ⚠️ LARGE
│   ├── gym-location.tsx                   # CLIENT - Google Maps integration
│   ├── legal-compliance.tsx               # CLIENT - Terms acceptance checkbox
│   ├── mini-slideshow.tsx                 # CLIENT - Image carousel
│   ├── mode-toggle.tsx                    # CLIENT - Dark/light theme toggle
│   ├── more-menu.tsx                      # CLIENT - Navigation drawer
│   ├── payment-options.tsx                # CLIENT - Payment method selection
│   ├── sacred-background.tsx              # CLIENT - Thai-inspired backgrounds
│   ├── site-footer-menu.tsx               # CLIENT - Footer navigation
│   ├── site-header.tsx                    # CLIENT - Header navigation
│   ├── student-highlights.tsx             # CLIENT - Student testimonials
│   └── theme-provider.tsx                 # CLIENT - Theme context provider
│   │
│   └── ui/                                 # shadcn/ui Components (50+ files)
│       ├── accordion.tsx
│       ├── alert.tsx
│       ├── avatar.tsx
│       ├── button.tsx
│       ├── card.tsx
│       ├── dropdown-menu.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── select.tsx
│       ├── separator.tsx
│       ├── toast.tsx
│       ├── toaster.tsx
│       └── ... (40+ more UI components)
│
├── hooks/                                  # Custom React Hooks
│   ├── use-mobile.tsx                      # Hook for mobile detection
│   └── use-toast.ts                        # Hook for toast notifications
│
├── lib/                                    # Utility Libraries
│   ├── booking-api.ts                      # Booking data structures & validation
│   ├── booking-config.ts                   # Service definitions & time slots
│   ├── email-service.tsx                   # Email sending via Resend
│   ├── email-service-setup.tsx             # Email service configuration ⚠️ DUPLICATE
│   ├── fighters-data.ts                    # Fighter profiles data
│   ├── payment-api.ts                      # Payment API utilities
│   ├── payment-config.ts                   # Currency & pricing config
│   ├── stripe-config.ts                    # Stripe configuration
│   └── utils.ts                            # General utilities (cn function)
│
├── middleware.ts                           # MIDDLEWARE - Route redirects & auth
│
├── public/                                 # Static Assets
│   ├── images/                             # Image assets
│   ├── favicon.ico                         # Favicon
│   ├── manifest.json                       # PWA manifest
│   ├── robots.txt                          # SEO robots file
│   └── sitemap.xml                         # SEO sitemap
│
├── docs/                                   # Documentation
│   ├── PROJECT_OVERVIEW.md
│   ├── BOOKING_SYSTEM.md
│   ├── PAYMENT_SYSTEM.md
│   ├── EMAIL_SYSTEM.md
│   ├── DESIGN_SYSTEM.md
│   ├── DIAGNOSTIC_REPORT.md
│   └── COMPLETE_ARCHITECTURE_MAP.md        # This file
│
├── next.config.mjs                         # Next.js configuration
├── tailwind.config.ts                      # Tailwind CSS configuration
├── tsconfig.json                           # TypeScript configuration
├── package.json                            # Dependencies
├── .env.local                              # Environment variables
└── .env.example                            # Environment variable template
```

**Legend:**
- `RSC` = React Server Component
- `CLIENT` = Client Component ("use client")
- `SERVER` = Server-only (API routes, middleware)
- ⚠️ = Issue or note

---

## 2. Component Dependencies & Import Graph

### Homepage (`app/client.tsx`)
```
ClientPage (CLIENT)
  ├─ imports: BookingSection
  ├─ imports: MoreMenu
  ├─ imports: StudentHighlights (dynamic)
  ├─ imports: GymLocation (dynamic)
  ├─ imports: next-themes (useTheme)
  ├─ imports: framer-motion (AnimatePresence, motion)
  └─ imports: lucide-react (icons)
```

### Booking Flow
```
BookingSection (CLIENT)
  ├─ imports: EnhancedPaymentFlow
  ├─ imports: CalendlyIntegration
  ├─ imports: Button, Label, RadioGroup (UI)
  ├─ imports: BOOKING_SERVICES, PRIVATE_LESSON_TYPES
  └─ imports: formatPrice

EnhancedPaymentFlow (CLIENT)
  ├─ imports: PaymentForm (internal component)
  ├─ imports: ApplePayButton (internal component)
  ├─ imports: LegalCompliance
  ├─ imports: @stripe/stripe-js
  ├─ imports: @stripe/react-stripe-js
  ├─ imports: getPaymentSummary
  └─ imports: getTimeSlotsForService, shouldShowTimeSlots
```

### Email System
```
EmailService (lib/email-service.tsx)
  ├─ imports: resend (npm package)
  ├─ uses: RESEND_API_KEY (env)
  └─ exports: EmailService class

email-service-setup.tsx ⚠️ DUPLICATE
  ├─ imports: resend
  └─ exports: sendBookingConfirmation, sendStaffNotification
```

### Payment System
```
Stripe Integration
  ├─ /api/create-payment-intent/route.ts
  │   ├─ imports: stripe (npm)
  │   ├─ imports: convertThbToUsd
  │   └─ uses: STRIPE_SECRET_KEY
  │
  ├─ /api/webhooks/stripe/route.ts
  │   ├─ imports: stripe
  │   ├─ imports: EmailService
  │   ├─ uses: STRIPE_SECRET_KEY
  │   └─ uses: STRIPE_WEBHOOK_SECRET
  │
  └─ components/enhanced-payment-flow.tsx
      ├─ imports: @stripe/stripe-js
      ├─ imports: @stripe/react-stripe-js
      └─ uses: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
```

---

## 3. Page Routes → Component Dependencies

| Route | Page File | Client Component | Key Dependencies |
|-------|-----------|------------------|------------------|
| `/` | `app/page.tsx` | `app/client.tsx` | BookingSection, MoreMenu, StudentHighlights, GymLocation |
| `/classes` | `app/classes/page.tsx` | `app/classes/client.tsx` | MoreMenu, SacredBackground, MiniSlideshow, BookingSection |
| `/fighters` | `app/fighters/page.tsx` | `app/fighters/client.tsx` | fighters-data, Accordion |
| `/gym` | `app/gym/page.tsx` | `app/gym/client.tsx` | - |
| `/blog` | `app/blog/page.tsx` | inline (same file) | Accordion, MoreMenu |
| `/contact` | `app/contact/page.tsx` | inline (same file) | MoreMenu, BookingSection |
| `/faq` | `app/faq/page.tsx` | inline (same file) | SiteHeader, SiteFooterMenu |
| `/apprenticeship` | `app/apprenticeship/page.tsx` | inline (same file) | Accordion, MoreMenu |
| `/careers` | `app/careers/page.tsx` | inline (same file) | Accordion, MoreMenu |
| `/certificate-programs` | `app/certificate-programs/page.tsx` | `app/certificate-programs/client.tsx` | - |
| `/train-and-stay` | `app/train-and-stay/page.tsx` | `app/train-and-stay/client.tsx` | - |
| `/education-visas` | `app/education-visas/page.tsx` | inline (same file) | MoreMenu, Input, Button |
| `/pai-thailand` | `app/pai-thailand/page.tsx` | inline (same file) | MoreMenu, MiniSlideshow |
| `/login` | `app/login/page.tsx` | inline (same file) | SacredBackground, Card, Input, Button |
| `/booking-success` | `app/booking-success/page.tsx` | inline (same file) | Card, Button |

---

## 4. Global Utilities & Shared Resources

### lib/ Directory

| File | Purpose | Key Exports | Used By |
|------|---------|-------------|---------|
| `utils.ts` | Utility functions | `cn()` - classname helper | All components |
| `booking-config.ts` | Booking configuration | BOOKING_SERVICES, TIME_SLOTS, SKILL_LEVELS | Booking components |
| `booking-api.ts` | Booking data structures | BookingData interface, validation functions | Booking flow |
| `payment-config.ts` | Payment configuration | THB_TO_USD_RATE, currency conversion | Payment components |
| `stripe-config.ts` | Stripe utilities | STRIPE_CONFIG, validation functions | Stripe integration |
| `email-service.tsx` | Email service class | EmailService singleton | API routes |
| `email-service-setup.tsx` | Email helpers ⚠️ DUPLICATE | sendBookingConfirmation | API routes |
| `fighters-data.ts` | Fighter profiles | fighters array | Fighters page |

### hooks/ Directory

| Hook | Purpose | Used By |
|------|---------|---------|
| `use-mobile.tsx` | Mobile detection | Various responsive components |
| `use-toast.ts` | Toast notifications | Form submissions, errors |

---

## 5. API Routes Summary

| Endpoint | Method | Purpose | Authentication | Integrations |
|----------|--------|---------|----------------|--------------|
| `/api/create-payment-intent` | POST | Create Stripe payment intent | None | Stripe API |
| `/api/send-booking-confirmation` | POST | Send booking emails | None | Resend API |
| `/api/send-booking-emails` | POST | Send emails (alternative) ⚠️ DUPLICATE | None | Resend API |
| `/api/test-email` | GET/POST | Test email configuration | None | Resend API |
| `/api/webhooks/stripe` | POST/GET | Handle Stripe webhooks | Stripe signature | Stripe, Resend |

**Webhook Events Handled:**
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `checkout.session.completed`
- `checkout.session.expired`
- `checkout.session.async_payment_succeeded`
- `checkout.session.async_payment_failed`

---

## 6. Stripe Integration Code Paths

### Payment Flow
```
User clicks "Book" 
  ↓
BookingSection opens
  ↓
EnhancedPaymentFlow renders
  ↓
User fills details (name, email, date, time)
  ↓
User selects payment method (Card/Apple Pay/Cash)
  ↓
IF CASH:
  → POST /api/send-booking-emails
  → Send confirmation emails
  → Show success screen
  
IF CARD/APPLE PAY:
  → POST /api/create-payment-intent
    ↓ (uses STRIPE_SECRET_KEY)
  ← Returns clientSecret
  ↓
  Stripe.confirmCardPayment(clientSecret)
    ↓ (uses NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  ← Payment succeeds/fails
  ↓
  Stripe webhook triggers
  → POST /api/webhooks/stripe
    ↓ (validates STRIPE_WEBHOOK_SECRET)
  ← Process payment_intent.succeeded
  ↓
  Send confirmation emails via EmailService
  ↓
  Show success screen with payment ID
```

### Stripe Environment Variables
```
STRIPE_SECRET_KEY              # Server-side payment processing
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY  # Client-side Stripe.js
STRIPE_WEBHOOK_SECRET          # Webhook signature validation
```

---

## 7. Resend Integration Code Paths

### Email Flow
```
Booking completed (payment or cash)
  ↓
/api/webhooks/stripe OR /api/send-booking-emails
  ↓
EmailService.sendCustomerConfirmation()
  ├─ Uses: RESEND_API_KEY
  ├─ From: info@paimuaythai.com
  ├─ To: customer email
  └─ Template: Booking confirmation with details
  
EmailService.sendStaffNotification()
  ├─ Uses: RESEND_API_KEY, STAFF_NOTIFICATION_EMAIL
  ├─ From: info@paimuaythai.com
  ├─ To: help@muaythaipai.com
  └─ Template: Staff notification with booking details
```

### Resend Environment Variables
```
RESEND_API_KEY                 # API key for sending emails
STAFF_NOTIFICATION_EMAIL       # Staff email address
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL  # Dev email redirect (future)
```

---

## 8. Issues & Technical Debt

### Critical Issues

❌ **1. Duplicate Email Services**
- **Files:** `lib/email-service.tsx` AND `lib/email-service-setup.tsx`
- **Impact:** Confusion, potential inconsistencies
- **Used By:** Different API routes use different services
- **Recommendation:** Consolidate into single `lib/email-service.ts`

❌ **2. Inconsistent Client Page Naming**
- **Pattern 1:** `ClientPage.tsx` (homepage only)
- **Pattern 2:** `_client-page.tsx` (classes - old file)
- **Pattern 3:** `page-client.tsx` (fighters, gym, train-and-stay, certificate-programs)
- **Pattern 4:** Inline "use client" in page.tsx (8 pages)
- **Status:** Partially fixed - standardizing to `client.tsx`
- **Recommendation:** Complete migration to `client.tsx` standard

❌ **3. Duplicate Hook Files**
- **Files:** `hooks/use-mobile.tsx` AND `components/ui/use-mobile.tsx`
- **Files:** `hooks/use-toast.ts` AND `components/ui/use-toast.ts`
- **Impact:** Import confusion, maintenance burden
- **Recommendation:** Keep only `hooks/` versions, remove `components/ui/` copies

### Large Files (>200 LOC)

⚠️ **Files Exceeding Best Practice Size:**

1. **`app/blog/page.tsx`** - 2,105 lines
   - Contains: 10 full blog posts with content
   - **Issue:** Should extract blog posts to separate data file
   - **Recommendation:** Create `lib/blog-posts.ts` with post data

2. **`components/enhanced-payment-flow.tsx`** - 909 lines
   - Contains: Payment form, Apple Pay, cash payment logic
   - **Issue:** Complex component with multiple responsibilities
   - **Recommendation:** Split into:
     - `payment-form.tsx` (card payment)
     - `apple-pay-button.tsx` (Apple Pay)
     - `cash-payment.tsx` (cash handling)
     - `booking-summary.tsx` (summary display)

3. **`app/client.tsx`** - 700+ lines
   - Contains: Homepage with video, family carousel, booking
   - **Issue:** Large but acceptable for main homepage
   - **Recommendation:** Consider extracting family carousel to separate component

### Missing/Broken Patterns

⚠️ **Environment Variable Validation**
- **Issue:** No startup check that required env vars are set
- **Impact:** Runtime errors if keys missing
- **Recommendation:** Add validation in `lib/config.ts`:
```typescript
function validateEnv() {
  const required = ['STRIPE_SECRET_KEY', 'RESEND_API_KEY', 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY']
  const missing = required.filter(key => !process.env[key])
  if (missing.length) throw new Error(`Missing env vars: ${missing.join(', ')}`)
}
```

⚠️ **Inconsistent Error Handling**
- **Issue:** Some API routes return JSON errors, others throw
- **Impact:** Inconsistent client-side error handling
- **Recommendation:** Standardize error response format

⚠️ **No Rate Limiting**
- **Issue:** API endpoints have no rate limiting
- **Impact:** Vulnerable to abuse/spam bookings
- **Recommendation:** Add rate limiting middleware

---

## 9. Dependency Graphs by System

### Booking System
```
User Interface Layer:
  BookingSection (main entry)
    ↓
  EnhancedPaymentFlow (payment handling)
    ↓
  PaymentForm / ApplePayButton / Cash (payment methods)
    ↓
  
API Layer:
  /api/create-payment-intent
    ↓
  Stripe SDK
    ↓
  Payment Intent Created
  
Webhook Layer:
  /api/webhooks/stripe
    ↓
  EmailService
    ↓
  Resend API
    ↓
  Confirmation Emails Sent
```

### Fighters System
```
fighters/page.tsx (RSC wrapper)
  ↓
fighters/client.tsx (display logic)
  ↓
lib/fighters-data.ts (data source)
  ↓
Accordion UI component
  ↓
Rendered fighter profiles
```

### Certificate Programs
```
certificate-programs/page.tsx (RSC wrapper)
  ↓
certificate-programs/client.tsx (display)
  ↓
Static content (no external data)
```

### Payment System
```
Client Layer:
  EnhancedPaymentFlow
    ├─ loads Stripe.js
    ├─ uses NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    └─ collects payment info
  
Server Layer:
  /api/create-payment-intent
    ├─ uses STRIPE_SECRET_KEY
    ├─ converts THB → USD
    └─ creates payment intent
  
Webhook Layer:
  /api/webhooks/stripe
    ├─ validates signature
    ├─ processes payment events
    └─ triggers emails
```

### Blog System
```
blog/page.tsx (CLIENT - 2100 LOC)
  ├─ blogPosts array (hardcoded - 10 posts)
  ├─ Search functionality
  ├─ Accordion display
  ├─ MoreMenu navigation
  └─ Theme toggle

Recommendation: Extract to:
  blog/page.tsx (display logic - 300 LOC)
  lib/blog-posts.ts (data - 1800 LOC)
```

---

## 10. Maintainability Scores & Recommendations

### Module Ratings (Scale: A+ to F)

| Module | Score | Lines | Issues | Recommendation |
|--------|-------|-------|--------|----------------|
| **Booking System** | B+ | ~400 | Minor duplication | Consolidate email services |
| **Payment System** | B | ~900 | Large file | Split payment flow component |
| **Email System** | C | ~400 | Duplicate files | Merge into single service |
| **Blog System** | D | 2100 | Data in component | Extract data to separate file |
| **Fighters System** | A | ~150 | None | Well-structured |
| **Navigation** | B+ | ~300 | Minor duplication | Good overall |
| **UI Components** | A | ~2000 | None | shadcn/ui standard |
| **API Routes** | B | ~500 | No rate limiting | Add protection |
| **Config/Utils** | B | ~600 | Duplicates | Clean up hooks |

### Priority Refactoring Tasks

**🔴 High Priority:**
1. Extract blog post data from component (saves 1800 LOC)
2. Consolidate duplicate email services (removes confusion)
3. Complete client page naming standardization
4. Remove duplicate hook files

**🟡 Medium Priority:**
5. Split large payment flow component
6. Add environment variable validation
7. Standardize API error handling
8. Add rate limiting to API endpoints

**🟢 Low Priority:**
9. Extract family carousel from homepage
10. Add JSDoc comments to utilities
11. Improve TypeScript strict mode compliance
12. Add unit tests for critical functions

---

## 11. Next.js Best Practice Compliance

### ✅ Good Practices

1. **App Router Usage:** Correctly using Next.js 14 app router
2. **RSC/Client Separation:** Proper use of "use client" directive
3. **Dynamic Imports:** Using dynamic imports for heavy components
4. **Metadata API:** Proper SEO metadata in layouts
5. **Route Groups:** Good organization of related pages
6. **API Routes:** Correct use of route.ts pattern
7. **Environment Variables:** Proper NEXT_PUBLIC_ prefix usage
8. **Image Optimization:** Using Next.js Image component where appropriate

### ❌ Areas for Improvement

1. **Loading States:** Missing loading.tsx for some routes
2. **Error Boundaries:** No error.tsx files for error handling
3. **Parallel Routes:** Not using parallel routes where beneficial
4. **Streaming:** Could use Suspense more extensively
5. **Server Actions:** Not using server actions (could replace some API routes)
6. **Middleware:** Basic middleware but could be more sophisticated

---

## 12. Architecture Recommendations

### Immediate Actions (This Week)

1. **Data Extraction:**
   ```typescript
   // Create lib/blog-posts.ts
   export const blogPosts = [ ... ]
   
   // Update app/blog/page.tsx
   import { blogPosts } from '@/lib/blog-posts'
   ```

2. **Email Service Consolidation:**
   ```typescript
   // Keep lib/email-service.ts
   // Delete lib/email-service-setup.tsx
   // Update all imports to use single service
   ```

3. **Complete Client Page Migration:**
   ```bash
   # Rename remaining files to client.tsx
   mv app/classes/_client-page.tsx app/classes/client.tsx (if exists)
   # Update imports
   ```

### Short-term (This Month)

4. **Component Splitting:**
   ```
   components/
   ├── payment/
   │   ├── payment-form.tsx
   │   ├── apple-pay-button.tsx
   │   ├── cash-payment.tsx
   │   └── booking-summary.tsx
   ```

5. **Add Validation:**
   ```typescript
   // lib/config.ts
   export function validateEnv() { ... }
   
   // Call in layout.tsx or middleware
   ```

6. **Remove Duplicates:**
   ```bash
   rm components/ui/use-mobile.tsx
   rm components/ui/use-toast.ts
   # Update imports to use hooks/ versions
   ```

### Long-term (Next Quarter)

7. **Database Integration:**
   - Add Supabase for booking history
   - Track customer bookings
   - Store fighter/class data
   - Analytics and reporting

8. **Authentication:**
   - Implement user accounts
   - Booking history for users
   - Admin dashboard
   - Staff management

9. **Testing:**
   - Unit tests for utilities
   - Integration tests for booking flow
   - E2E tests for critical paths

10. **Performance:**
    - Implement ISR for blog posts
    - Add caching layer
    - Optimize images
    - Reduce bundle size

---

## 13. Maintenance Score Summary

### Overall Project Health: B+ (83/100)

**Strengths:**
- ✅ Well-organized file structure
- ✅ Good use of modern Next.js features
- ✅ Proper TypeScript usage
- ✅ Clean component architecture
- ✅ Good integration patterns
- ✅ Responsive design implementation

**Weaknesses:**
- ⚠️ Some large files need splitting
- ⚠️ Duplicate code in a few places
- ⚠️ Inconsistent naming patterns (partially fixed)
- ⚠️ Missing error boundaries
- ⚠️ No rate limiting
- ⚠️ No automated testing

**Trajectory:** 🟢 Improving
- Recent refactoring cleaned up client page naming
- Documentation being added
- Code quality awareness is high

---

## 14. Quick Reference

### Key Files to Know

**Core Application:**
- `app/client.tsx` - Main homepage
- `components/booking-section.tsx` - Booking interface
- `components/enhanced-payment-flow.tsx` - Payment processing
- `lib/booking-config.ts` - Service definitions

**API Endpoints:**
- `app/api/create-payment-intent/route.ts` - Stripe payments
- `app/api/webhooks/stripe/route.ts` - Webhook handling
- `app/api/send-booking-emails/route.ts` - Email notifications

**Configuration:**
- `.env.local` - Environment variables
- `lib/payment-config.ts` - Currency conversion
- `lib/stripe-config.ts` - Stripe setup
- `middleware.ts` - Route handling

### Environment Variables Required

```bash
# Stripe (Payment Processing)
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Resend (Email Delivery)
RESEND_API_KEY=re_...
STAFF_NOTIFICATION_EMAIL=help@muaythaipai.com
```

### Common Tasks

**Add New Service:**
1. Update `lib/booking-config.ts` → BOOKING_SERVICES
2. Add pricing to `lib/payment-config.ts`
3. Test booking flow

**Modify Email Templates:**
1. Edit `lib/email-service.tsx`
2. Update both customer and staff templates
3. Test via `/api/test-email`

**Add New Page:**
1. Create `app/[route]/page.tsx` (RSC wrapper)
2. Create `app/[route]/client.tsx` (client component)
3. Update navigation in `components/more-menu.tsx`
4. Add metadata for SEO

---

## Conclusion

The Muay Thai Pai project is a well-architected Next.js application with good separation of concerns and modern React patterns. While there are areas for improvement (particularly around code duplication and file sizes), the overall structure is solid and maintainable.

The recent refactoring work to standardize client page naming shows active maintenance and code quality awareness. With the recommended improvements implemented, this project could easily achieve an A-grade maintainability score.

**Next Steps:**
1. Complete data extraction from large components
2. Consolidate duplicate services
3. Add environment validation
4. Implement rate limiting
5. Consider database integration for future scalability

---

**Document Version:** 1.0  
**Last Updated:** December 2024  
**Maintainer:** v0 Architecture Team
