import type { BlogPost } from "@/lib/blog-data"

interface ArticleSchemaProps {
  post: BlogPost
}

export function ArticleSchema({ post }: ArticleSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    datePublished: post.date,
    dateModified: post.updatedAt || post.date,
    author: {
      "@type": "Organization",
      name: "Muay Thai Pai",
      url: "https://muaythaipai.com",
    },
    publisher: {
      "@type": "Organization",
      name: "Muay Thai Pai",
      logo: {
        "@type": "ImageObject",
        url: "https://muaythaipai.com/images/logo.png",
      },
    },
    description: post.excerpt,
    image: post.image || "https://muaythaipai.com/images/og-default.jpg",
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://muaythaipai.com/blog/${post.id}`,
    },
    keywords: post.tags.join(", "),
  }

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
}
