# PAI MUAY THAI - TECHNICAL DIAGNOSTIC REPORT

**Generated:** December 7, 2024  
**Project:** Muay Thai Pai Website  
**Framework:** Next.js 14+ (App Router)  
**Deployment:** Vercel

---

## 1. PAGES AND ROUTES

### Public Pages (12 total)

| Route | File Pattern | Purpose |
|-------|-------------|---------|
| `/` | `app/page.tsx` + `app/ClientPage.tsx` | Homepage with family carousel, booking CTA |
| `/classes` | `app/classes/page.tsx` + `_client-page.tsx` | Service offerings, booking flow |
| `/fighters` | `app/fighters/page.tsx` + `page-client.tsx` | Fighter profiles with active/retired states |
| `/gym` | `app/gym/page.tsx` + `page-client.tsx` | About the gym, facilities |
| `/train-and-stay` | `app/train-and-stay/page.tsx` + `page-client.tsx` | Accommodation packages |
| `/certificate-programs` | `app/certificate-programs/page.tsx` + `page-client.tsx` | Certification levels |
| `/blog` | `app/blog/page.tsx` | News, articles, content |
| `/contact` | `app/contact/page.tsx` | Contact form, location |
| `/faq` | `app/faq/page.tsx` | Frequently asked questions |
| `/pai-thailand` | `app/pai-thailand/page.tsx` | About Pai location |
| `/education-visas` | `app/education-visas/page.tsx` | Visa information |
| `/careers` | `app/careers/page.tsx` | Job opportunities |
| `/apprenticeship` | `app/apprenticeship/page.tsx` | Apprenticeship program |
| `/login` | `app/login/page.tsx` | Online subscription/login |
| `/booking-success` | `app/booking-success/page.tsx` | Post-booking confirmation |

### API Routes (5 total)

| Route | Purpose |
|-------|---------|
| `/api/create-payment-intent` | Creates Stripe payment intents |
| `/api/webhooks/stripe` | Handles Stripe webhook events |
| `/api/send-booking-emails` | Sends booking confirmation emails |
| `/api/send-booking-confirmation` | Alternative email endpoint (uses different service) |
| `/api/test-email` | Tests email configuration |

### URL Redirects (via middleware.ts)

The middleware handles **70+ URL redirects** from old Wix URLs to new Next.js routes. Key categories:
- Wix service-page URLs → `/classes` or `/certificate-programs`
- Old page variations → Correct canonical URLs
- SEO cleanup for 404s found in Google Search Console

---

## 2. COMPONENTS INVENTORY

### Custom Components (18 total)

| Component | File | Purpose |
|-----------|------|---------|
| `BookingSection` | `components/booking-section.tsx` | Main booking UI with service selection |
| `EnhancedPaymentFlow` | `components/enhanced-payment-flow.tsx` | Multi-step payment wizard |
| `BookingProgressIndicator` | `components/booking-progress-indicator.tsx` | Step indicator for booking flow |
| `MoreMenu` | `components/more-menu.tsx` | Slide-out navigation menu |
| `SiteHeader` | `components/site-header.tsx` | Top header with social/theme toggle |
| `SiteFooterMenu` | `components/site-footer-menu.tsx` | Bottom navigation bar |
| `SacredBackground` | `components/sacred-background.tsx` | Thai-themed animated background |
| `DynamicGradient` | `components/sacred-background.tsx` | Gradient overlay component |
| `MiniSlideshow` | `components/mini-slideshow.tsx` | Auto-playing image carousel |
| `StudentHighlights` | `components/student-highlights.tsx` | Student testimonials carousel |
| `GymLocation` | `components/gym-location.tsx` | Map and location info |
| `ThemeProvider` | `components/theme-provider.tsx` | Dark/light theme context |
| `ModeToggle` | `components/mode-toggle.tsx` | Theme toggle button |
| `LegalCompliance` | `components/legal-compliance.tsx` | Liability waiver checkbox |
| `PaymentOptions` | `components/payment-options.tsx` | Payment method selection |
| `CalendlyIntegration` | `components/calendly-integration.tsx` | Calendly booking widget |
| `CalendlyPopup` | `components/calendly-popup.tsx` | Calendly popup modal |
| `Toaster` | `components/ui/toaster.tsx` | Toast notification display |

### UI Components (shadcn/ui - 25+ total)

Standard shadcn components used throughout:
- `Accordion`, `Alert`, `Avatar`, `Button`, `Card`
- `Checkbox`, `Collapsible`, `Input`, `Label`
- `RadioGroup`, `Select`, `Separator`, `Textarea`
- `Calendar`, `Carousel`, `Chart`, `Form`
- `Dropdown-menu`, `Popover`, `Sidebar`, `Toggle-group`

---

## 3. NAMING CONVENTIONS

### File Naming

| Pattern | Usage | Assessment |
|---------|-------|------------|
| `page.tsx` | Server component page entry | **GOOD** - Next.js standard |
| `page-client.tsx` | Client component for page | **INCONSISTENT** - Some use this |
| `_client-page.tsx` | Client component for page | **INCONSISTENT** - Some use underscore prefix |
| `ClientPage.tsx` | Client component (PascalCase) | **INCONSISTENT** - Homepage uses this |
| `kebab-case.tsx` | Component files | **GOOD** - Consistent |

### Component Naming

| Pattern | Example | Assessment |
|---------|---------|------------|
| PascalCase exports | `BookingSection`, `MoreMenu` | **GOOD** |
| Function components | `export function Component()` | **GOOD** |
| Props interfaces | `ComponentNameProps` | **GOOD** |

### Variable/Function Naming

| Pattern | Example | Assessment |
|---------|---------|------------|
| camelCase state | `showMoreMenu`, `isProcessing` | **GOOD** |
| SCREAMING_SNAKE constants | `BOOKING_SERVICES`, `PRICING` | **GOOD** |
| Descriptive handlers | `handlePaymentSuccess` | **GOOD** |

### Issues Identified

1. **Inconsistent client page naming:**
   - `ClientPage.tsx` (homepage)
   - `page-client.tsx` (most pages)
   - `_client-page.tsx` (classes page)
   
2. **Duplicate hooks:**
   - `hooks/use-mobile.tsx` AND `components/ui/use-mobile.tsx`
   - `hooks/use-toast.ts` AND `components/ui/use-toast.ts`

---

## 4. DATA FLOWS AND STATE MANAGEMENT

### State Management Pattern: Local State Only

The project uses **no global state management** (no Redux, Zustand, Context API for data).

All state is managed via `useState` at the component level:

```
Page Component
├── useState for UI state (menus, modals, expanded sections)
├── useState for form data
└── Child Components
    └── useState for local interactions
```

### Data Flow Patterns

**1. Booking Flow:**
```
BookingSection (service selection)
    ↓ props
EnhancedPaymentFlow (multi-step form)
    ↓ API call
/api/create-payment-intent
    ↓ Stripe SDK
Stripe Payment Processing
    ↓ webhook
/api/webhooks/stripe
    ↓ 
EmailService (confirmation emails)
```

**2. Configuration Data:**
```
lib/booking-config.ts
├── BOOKING_SERVICES (service definitions)
├── PRIVATE_LESSON_TYPES (lesson variants)
├── TIME_SLOTS (available booking times)
├── SKILL_LEVELS (skill level options)
└── getTimeSlotsForService() (helper function)
    ↓ imported by
components/booking-section.tsx
components/enhanced-payment-flow.tsx
```

**3. Fighter Data:**
```
lib/fighters-data.ts
└── fighters[] (static data array)
    ↓ imported by
app/fighters/page-client.tsx
```

### Props Drilling

The project uses moderate props drilling (1-2 levels max):
- `theme` prop passed from pages to components
- `onClose` callbacks for modals
- Service data passed to payment flow

---

## 5. INCONSISTENCIES AND STRUCTURAL ISSUES

### Critical Issues

**1. DUPLICATE Email Service Implementations**

Two separate email service files with different approaches:
- `lib/email-service.tsx` - Class-based `EmailService`
- `lib/email-service-setup.tsx` - Function exports + UI components

API routes are split between them:
- `/api/webhooks/stripe` uses `EmailService` from `email-service.tsx`
- `/api/send-booking-confirmation` uses functions from `email-service-setup.tsx`

**Recommendation:** Consolidate to single email service.

**2. CLIENT PAGE NAMING INCONSISTENCY**

Three different patterns for client-side page components:
```
app/ClientPage.tsx              (PascalCase, no prefix)
app/classes/_client-page.tsx    (underscore prefix)
app/fighters/page-client.tsx    (no prefix, different name)
```

**Recommendation:** Standardize to one pattern (suggest: `_client.tsx` or `client.tsx`).

**3. DUPLICATE HOOK FILES**

```
hooks/use-mobile.tsx          ← Duplicate
components/ui/use-mobile.tsx  ← Duplicate (identical code)

hooks/use-toast.ts            ← Duplicate  
components/ui/use-toast.ts    ← Duplicate (identical code)
```

**Recommendation:** Keep only one location (prefer `hooks/` directory).

### Moderate Issues

**4. Large Page Files**

Some page files are excessively large:
- `app/blog/page.tsx` - 1500+ lines (contains all blog content)
- `app/ClientPage.tsx` - 1000+ lines (homepage complexity)

**Recommendation:** Extract content to separate data files.

**5. Mixed Concerns in lib/email-service-setup.tsx**

This file contains:
- Email sending functions
- React UI components for email preview
- Email template previews

**Recommendation:** Separate UI components from service logic.

**6. Unused Layout Files**

- `app/careers/layout.tsx` exists but may not be needed (basic wrapper)

### Minor Issues

**7. Inconsistent Theme Handling**

Some pages check `theme === 'light'` while site defaults to dark mode.
Most pages work fine but there may be edge cases.

**8. Comments with "Assuming" Language**

Several comments indicate uncertainty:
```typescript
const [muted, setMuted] = useState(true) // Assuming default muted state
```

---

## 6. MISSING DEPENDENCIES, BROKEN IMPORTS, UNUSED CODE

### Verified Working Imports

All `@/components/*` imports verified as working.
All `@/lib/*` imports verified as working.

### Potentially Unused Code

**1. PaymentOptions Component**

`components/payment-options.tsx` - May be legacy code replaced by `EnhancedPaymentFlow`.

**Verification needed:** Search for actual usage.

**2. CalendlyIntegration/CalendlyPopup**

These components exist but it's unclear if Calendly is actively used in the booking flow.

**3. Legacy Email Route**

`/api/send-booking-confirmation/route.ts` imports from `email-service-setup.tsx`.
Main webhook uses `email-service.tsx`. One may be deprecated.

### Missing Pieces

**1. No Error Boundary Components**

No React error boundaries for graceful error handling.

**2. No Loading States File**

Individual pages handle loading, but no shared loading component.

**3. No 404 Custom Page**

Relies on Next.js default 404. Should have custom `app/not-found.tsx`.

**4. No Environment Validation**

No runtime check that required env vars (`STRIPE_SECRET_KEY`, `RESEND_API_KEY`, etc.) are set.

---

## 7. PROJECT ARCHITECTURE MAP

```
PAI MUAY THAI PROJECT
│
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout (Cinzel font, ThemeProvider, analytics)
│   ├── globals.css              # Tailwind + CSS variables
│   ├── page.tsx                 # Homepage (RSC entry)
│   ├── ClientPage.tsx           # Homepage client component
│   │
│   ├── [route]/                 # Public pages
│   │   ├── page.tsx             # RSC with metadata
│   │   └── page-client.tsx      # Client component (interactive)
│   │
│   ├── api/                     # API routes
│   │   ├── create-payment-intent/
│   │   ├── webhooks/stripe/
│   │   ├── send-booking-emails/
│   │   ├── send-booking-confirmation/
│   │   └── test-email/
│   │
│   └── booking-success/         # Post-payment confirmation
│
├── components/                   # React components
│   ├── ui/                      # shadcn/ui primitives (25+)
│   ├── booking-section.tsx      # Main booking UI
│   ├── enhanced-payment-flow.tsx # Payment wizard
│   ├── more-menu.tsx            # Navigation menu
│   ├── sacred-background.tsx    # Thai-themed background
│   └── [other components...]
│
├── lib/                         # Utilities and services
│   ├── booking-config.ts        # Service definitions, time slots
│   ├── payment-config.ts        # Pricing, currency conversion
│   ├── fighters-data.ts         # Fighter profiles data
│   ├── email-service.tsx        # Email service (Class-based)
│   ├── email-service-setup.tsx  # Email service (Functions + UI)
│   ├── stripe-config.ts         # Stripe configuration
│   ├── booking-api.ts           # Booking API utilities
│   ├── payment-api.ts           # Payment API utilities
│   └── utils.ts                 # General utilities (cn function)
│
├── hooks/                       # Custom React hooks
│   ├── use-mobile.tsx           # Mobile detection
│   └── use-toast.ts             # Toast notifications
│
├── public/                      # Static assets
│   ├── images/                  # Gym photos, logos
│   ├── manifest.json            # PWA manifest
│   └── [favicons, robots.txt]
│
├── docs/                        # Documentation
│   ├── PROJECT_OVERVIEW.md
│   ├── BOOKING_SYSTEM.md
│   ├── PAYMENT_SYSTEM.md
│   ├── EMAIL_SYSTEM.md
│   └── DESIGN_SYSTEM.md
│
└── middleware.ts                # URL redirects (70+ Wix → Next.js)
```

### Integration Dependencies

```
EXTERNAL SERVICES
│
├── Stripe                       # Payment processing
│   ├── STRIPE_SECRET_KEY
│   ├── STRIPE_PUBLISHABLE_KEY
│   └── STRIPE_WEBHOOK_SECRET
│
├── Resend                       # Email delivery
│   └── RESEND_API_KEY
│
├── Vercel                       # Hosting + Analytics
│   ├── SpeedInsights
│   └── Analytics
│
└── Google                       # Analytics + Search
    ├── Google Analytics (G-KM47GH0T7J)
    └── Search Console verification
```

---

## SUMMARY: ACTION ITEMS

### High Priority (Should Fix)

1. [ ] Consolidate email services into single implementation
2. [ ] Standardize client page naming convention
3. [ ] Remove duplicate hook files
4. [ ] Add custom 404 page

### Medium Priority (Should Consider)

5. [ ] Extract blog content to data file (reduce page size)
6. [ ] Separate UI from email-service-setup.tsx
7. [ ] Add error boundary components
8. [ ] Add environment variable validation

### Low Priority (Nice to Have)

9. [ ] Review PaymentOptions component usage
10. [ ] Verify Calendly integration is needed
11. [ ] Clean up "Assuming" comments
12. [ ] Add shared loading component

---

**Report Complete**
