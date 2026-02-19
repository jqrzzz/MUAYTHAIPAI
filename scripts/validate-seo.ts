// SEO Validation Script
// Run this during development to catch SEO issues before deployment
// Usage: npx ts-node scripts/validate-seo.ts

import fs from "fs"
import path from "path"

interface SEOIssue {
  severity: "error" | "warning" | "info"
  file: string
  issue: string
  line?: number
}

class SEOValidator {
  private issues: SEOIssue[] = []
  private appDir = path.join(process.cwd(), "app")

  // Validation rules
  private rules = {
    h1Required: true,
    metadataRequired: true,
    ogImageRequired: true,
    twitterCardRequired: true,
    uniqueH1: true,
    maxH1Count: 1,
  }

  async validate() {
    console.log("🔍 Starting SEO validation...\n")

    await this.validateAllPages()

    this.printReport()
    return this.issues.filter((i) => i.severity === "error").length === 0
  }

  private async validateAllPages() {
    const pages = this.findAllPageFiles(this.appDir)

    for (const pagePath of pages) {
      await this.validatePage(pagePath)
    }
  }

  private findAllPageFiles(dir: string, files: string[] = []): string[] {
    const entries = fs.readdirSync(dir, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)

      if (entry.isDirectory()) {
        // Skip api, _next, node_modules
        if (!["api", "_next", "node_modules"].includes(entry.name)) {
          this.findAllPageFiles(fullPath, files)
        }
      } else if (entry.name === "page.tsx") {
        files.push(fullPath)
      }
    }

    return files
  }

  private async validatePage(pagePath: string) {
    const relativePath = path.relative(process.cwd(), pagePath)
    const content = fs.readFileSync(pagePath, "utf-8")
    const clientPath = pagePath.replace("page.tsx", "client.tsx")
    let clientContent = ""

    if (fs.existsSync(clientPath)) {
      clientContent = fs.readFileSync(clientPath, "utf-8")
    }

    // Check for metadata export
    if (!content.includes("export const metadata")) {
      this.issues.push({
        severity: "error",
        file: relativePath,
        issue: "Missing metadata export",
      })
    }

    // Check for OpenGraph image
    if (content.includes("export const metadata") && !content.includes("openGraph")) {
      this.issues.push({
        severity: "warning",
        file: relativePath,
        issue: "Missing OpenGraph metadata",
      })
    }

    // Check for Twitter card
    if (content.includes("export const metadata") && !content.includes("twitter")) {
      this.issues.push({
        severity: "warning",
        file: relativePath,
        issue: "Missing Twitter card metadata",
      })
    }

    // Check for H1 in client component
    if (clientContent) {
      const h1Matches = clientContent.match(/<h1/g)

      if (!h1Matches || h1Matches.length === 0) {
        this.issues.push({
          severity: "error",
          file: clientPath.replace(process.cwd(), ""),
          issue: "No H1 tag found in page",
        })
      } else if (h1Matches.length > 1) {
        this.issues.push({
          severity: "error",
          file: clientPath.replace(process.cwd(), ""),
          issue: `Multiple H1 tags found (${h1Matches.length}). Should be exactly 1 per page.`,
        })
      }
    }

    // Check for proper title format
    const titleMatch = content.match(/title:\s*["'](.+?)["']/)
    if (titleMatch) {
      const title = titleMatch[1]
      if (title.length > 60) {
        this.issues.push({
          severity: "warning",
          file: relativePath,
          issue: `Title too long (${title.length} chars). Recommended: 50-60 characters.`,
        })
      }
      if (title.length < 30) {
        this.issues.push({
          severity: "info",
          file: relativePath,
          issue: `Title might be too short (${title.length} chars). Recommended: 50-60 characters.`,
        })
      }
    }

    // Check for description length
    const descMatch = content.match(/description:\s*["'](.+?)["']/s)
    if (descMatch) {
      const desc = descMatch[1]
      if (desc.length > 160) {
        this.issues.push({
          severity: "warning",
          file: relativePath,
          issue: `Description too long (${desc.length} chars). Recommended: 150-160 characters.`,
        })
      }
      if (desc.length < 120) {
        this.issues.push({
          severity: "info",
          file: relativePath,
          issue: `Description might be too short (${desc.length} chars). Recommended: 150-160 characters.`,
        })
      }
    }
  }

  private printReport() {
    console.log("\n" + "=".repeat(80))
    console.log("SEO VALIDATION REPORT")
    console.log("=".repeat(80) + "\n")

    const errors = this.issues.filter((i) => i.severity === "error")
    const warnings = this.issues.filter((i) => i.severity === "warning")
    const info = this.issues.filter((i) => i.severity === "info")

    if (errors.length === 0 && warnings.length === 0 && info.length === 0) {
      console.log("✅ All SEO checks passed! No issues found.\n")
      return
    }

    if (errors.length > 0) {
      console.log(`❌ ERRORS (${errors.length})`)
      console.log("-".repeat(80))
      errors.forEach((issue) => {
        console.log(`  File: ${issue.file}`)
        console.log(`  Issue: ${issue.issue}\n`)
      })
    }

    if (warnings.length > 0) {
      console.log(`⚠️  WARNINGS (${warnings.length})`)
      console.log("-".repeat(80))
      warnings.forEach((issue) => {
        console.log(`  File: ${issue.file}`)
        console.log(`  Issue: ${issue.issue}\n`)
      })
    }

    if (info.length > 0) {
      console.log(`ℹ️  INFO (${info.length})`)
      console.log("-".repeat(80))
      info.forEach((issue) => {
        console.log(`  File: ${issue.file}`)
        console.log(`  Issue: ${issue.issue}\n`)
      })
    }

    console.log("=".repeat(80))
    console.log(`Total Issues: ${this.issues.length}`)
    console.log(`  Errors: ${errors.length}`)
    console.log(`  Warnings: ${warnings.length}`)
    console.log(`  Info: ${info.length}`)
    console.log("=".repeat(80) + "\n")

    if (errors.length > 0) {
      console.log("❌ SEO validation failed. Please fix the errors above.")
      process.exit(1)
    } else {
      console.log("✅ SEO validation passed (with warnings/info).")
    }
  }
}

// Run validation
const validator = new SEOValidator()
validator.validate().then((success) => {
  process.exit(success ? 0 : 1)
})
