# SEO IMPLEMENTATION GUIDE
*Quick Reference for Implementing Audit Fixes*

## PHASE 1: HIGH-PRIORITY FIXES (Week 1)

### Task 1: Add H1 Tags to All Pages

**Pages Missing H1:**
1. `/classes`
2. `/certificate-programs`
3. `/apprenticeship`
4. `/train-and-stay`
5. `/education-visas`
6. `/careers`
7. `/contact`
8. `/blog`
9. `/login`

**Implementation Pattern:**

```tsx
// Add near the top of each client.tsx file (after imports, before main content)

export default function PageClient() {
  // ... existing hooks ...

  return (
    <div>
      <SiteHeader />
      
      {/* ADD THIS HERO SECTION WITH H1 */}
      <section className="py-20 text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-6">
          {/* Page-specific title */}
        </h1>
        <p className="text-xl text-gray-300">
          {/* Page-specific subtitle */}
        </p>
      </section>

      {/* ... rest of content ... */}
    </div>
  )
}
```

**Specific H1 Content:**
- Classes: "Muay Thai Classes & Training Schedule"
- Certificate Programs: "Certificate Programs"
- Apprenticeship: "Muay Thai Apprenticeship Program"
- Train & Stay: "Train & Stay in Pai"
- Education Visas: "Education Visas for Muay Thai Training"
- Careers: "Join the Muay Thai Pai Family"
- Contact: "Get in Touch"
- Blog: "Muay Thai Pai Blog"

---

### Task 2: Add FAQ Structured Data

**File:** `app/faq/client.tsx`

**Add this code inside the component return, before the closing `</div>`:**

```tsx
{/* FAQ Structured Data */}
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqData.flatMap((category) =>
        category.questions.map((q) => ({
          "@type": "Question",
          name: q.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: q.answer,
          },
        }))
      ),
    }),
  }}
/>
```

**Impact:** Rich FAQ snippets in Google search results

---

### Task 3: Add OpenGraph Images

**Update these files with OG images:**

1. `app/classes/page.tsx`
2. `app/certificate-programs/page.tsx`
3. `app/apprenticeship/page.tsx`
4. `app/train-and-stay/page.tsx`
5. `app/education-visas/page.tsx`
6. `app/careers/page.tsx`
7. `app/fighters/page.tsx`
8. `app/gym/page.tsx`

**Pattern:**

```typescript
export const metadata: Metadata = {
  title: "...",
  description: "...",
  keywords: "...",
  openGraph: {
    title: "...",
    description: "...",
    url: "https://www.muaythaipai.com/[page-path]",
    images: [
      {
        url: "/images/[page-specific-image].jpeg",
        width: 1200,
        height: 630,
        alt: "[Descriptive alt text]",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "...",
    description: "...",
    images: ["/images/[page-specific-image].jpeg"],
  },
}
```

**Recommended Images:**
- Classes: `/images/group-training-pads.jpeg`
- Certificate Programs: `/images/naga-certificate.png`
- Apprenticeship: `/images/apprentice-training.jpeg` (create if needed)
- Train & Stay: `/images/society-house-hostel.png`
- Education Visas: `/images/thailand-visa-guide.jpeg` (create if needed)
- Careers: `/images/team-photo.jpeg` (create if needed)

---

### Task 4: Fix Multiple H1s on Gym Page

**File:** `app/gym/client.tsx`

**Find the second H1 (around line 121):**

```tsx
// BEFORE (line 121)
<h1 className="text-5xl font-black bg-gradient-to-r from-amber-300 to-yellow-500 bg-clip-text text-transparent">

// AFTER
<h2 className="text-5xl font-black bg-gradient-to-r from-amber-300 to-yellow-500 bg-clip-text text-transparent">
```

**Also update the closing tag:**
```tsx
// BEFORE
</h1>

// AFTER
</h2>
```

---

## PHASE 2: MEDIUM-PRIORITY FIXES (Week 2)

### Task 5: Implement Internal Linking System

**Add contextual internal links to these pages:**

#### Classes Page (`app/classes/client.tsx`)
Add after training schedule section:

```tsx
<div className="mt-12 p-6 bg-gradient-to-r from-orange-900/30 to-amber-900/30 rounded-2xl">
  <h3 className="text-2xl font-bold mb-4">Ready to Commit?</h3>
  <p className="mb-4">
    Explore our comprehensive{" "}
    <Link href="/certificate-programs" className="text-orange-400 hover:text-orange-300 underline">
      Certificate Programs
    </Link>{" "}
    for a structured path to Muay Thai mastery.
  </p>
</div>
```

#### Certificate Programs Page (`app/certificate-programs/client.tsx`)
Add before final CTA:

```tsx
<p className="mb-6">
  Planning to stay long-term? Learn about{" "}
  <Link href="/education-visas" className="text-orange-400 hover:text-orange-300 underline">
    Education Visas
  </Link>{" "}
  for extended training in Thailand.
</p>
```

#### Gym Page (`app/gym/client.tsx`)
Add after about section:

```tsx
<p className="mb-6">
  Meet the talented{" "}
  <Link href="/fighters" className="text-orange-400 hover:text-orange-300 underline">
    fighters
  </Link>{" "}
  who train at our gym and compete across Thailand.
</p>
```

#### Continue pattern for other pages...

---

### Task 6: Expand Content Depth

**Target pages for content expansion:**

1. **Classes Page** - Add sections:
   - "What to Expect in Your First Class"
   - "Training Methodology"
   - "Benefits of Traditional Muay Thai"
   - Target: 800+ words

2. **Fighters Page** - Add sections:
   - "Our Fighting Philosophy"
   - "Notable Achievements"
   - "The Path to Becoming a Fighter"
   - Target: 600+ words

3. **Apprenticeship Page** - Add sections:
   - "Daily Schedule"
   - "What You'll Learn"
   - "Success Stories"
   - Target: 800+ words

---

## PHASE 3: LOW-PRIORITY OPTIMIZATIONS (Week 3-4)

### Task 7: Add Course Schema to Certificate Programs

**File:** `app/certificate-programs/client.tsx`

```tsx
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Course",
      name: "Muay Thai Certificate Programs",
      description: "5-level progressive Muay Thai certification program",
      provider: {
        "@type": "Organization",
        name: "Muay Thai Pai",
        sameAs: "https://muaythaipai.com",
      },
      hasCourseInstance: [
        {
          "@type": "CourseInstance",
          name: "Naga - Level 1",
          courseMode: "onsite",
          duration: "P1M",
          inLanguage: "en",
        },
        // Add other levels...
      ],
    }),
  }}
/>
```

---

### Task 8: Noindex Login & Legal Pages

**Files:** `app/login/page.tsx`, `app/privacy-policy/page.tsx`, `app/terms-conditions/page.tsx`

**Add to metadata:**

```typescript
export const metadata: Metadata = {
  // ... existing metadata ...
  robots: "noindex, nofollow",
}
```

---

### Task 9: Add Article Schema for Blog Posts

**File:** Create `app/blog/[slug]/page.tsx` when adding blog posts

```tsx
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: post.title,
      description: post.excerpt,
      author: {
        "@type": "Person",
        name: "Kru Wisarut",
      },
      datePublished: post.publishedDate,
      dateModified: post.modifiedDate,
      image: post.featuredImage,
      publisher: {
        "@type": "Organization",
        name: "Muay Thai Pai",
        logo: {
          "@type": "ImageObject",
          url: "https://muaythaipai.com/images/muay-thai-logo-og.png",
        },
      },
    }),
  }}
/>
```

---

## TESTING CHECKLIST

After implementing fixes:

### Manual Checks
- [ ] All pages have exactly 1 H1
- [ ] All metadata exports are present
- [ ] OpenGraph images load correctly
- [ ] Twitter cards preview correctly
- [ ] FAQ schema validates (use Google Rich Results Test)
- [ ] Internal links work and make sense

### Automated Validation
```bash
# Run SEO validation script
npx ts-node scripts/validate-seo.ts

# Expected output: 0 errors
```

### Tools to Verify
1. **Google Rich Results Test**
   - URL: https://search.google.com/test/rich-results
   - Test FAQ page, Certificate Programs, Blog posts

2. **Facebook Sharing Debugger**
   - URL: https://developers.facebook.com/tools/debug/
   - Test all pages with OG images

3. **Twitter Card Validator**
   - URL: https://cards-dev.twitter.com/validator
   - Test all pages with Twitter cards

4. **Google Search Console**
   - Monitor coverage, mobile usability, structured data

---

## DEPLOYMENT

### Pre-Deployment
1. Run `npx ts-node scripts/validate-seo.ts`
2. Check all internal links manually
3. Verify image paths exist

### Post-Deployment
1. Submit updated sitemap to Google Search Console
2. Request re-indexing for major pages
3. Monitor Search Console for errors
4. Check Google Analytics for traffic changes

---

## MONITORING

**Weekly Checks:**
- Google Search Console > Coverage
- Google Search Console > Performance
- Structured data errors
- Mobile usability issues

**Monthly Review:**
- Organic traffic trends
- Top performing pages
- Keyword rankings
- Page load speeds

---

*End of Implementation Guide*
