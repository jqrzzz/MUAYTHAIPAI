interface BreadcrumbItem {
  name: string
  url: string
}

/**
 * Renders a BreadcrumbList JSON-LD `<script>` tag for the supplied crumb trail.
 * Use in `page.tsx` (RSC) alongside metadata to help search engines understand
 * the site hierarchy. The first crumb should be Home.
 */
export function BreadcrumbSchema({ items }: { items: BreadcrumbItem[] }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  }
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
