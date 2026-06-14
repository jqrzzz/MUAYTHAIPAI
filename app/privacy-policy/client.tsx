"use client"

import { PageBackground, MarketingTopNav, MarketingBottomNav } from "@/components/marketing"

export function PrivacyPolicyClient() {
  return (
    <PageBackground>
      {/* Content sits above PageBackground's z-10 orange overlay. */}
      <div className="relative z-20 min-h-screen pb-24">
        <MarketingTopNav />
        <div className="container mx-auto px-4 pt-24 pb-16">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold mb-8 text-gray-900 dark:text-white">
              Privacy Policy
            </h1>

            <div className="prose prose-lg max-w-none space-y-8">
              <p className="mb-6 text-gray-600 dark:text-gray-400">
                <strong>Effective Date:</strong> {new Date().toLocaleDateString()}
              </p>
              {/* rest of code here */}
            </div>
          </div>
        </div>
        <MarketingBottomNav />
      </div>
    </PageBackground>
  )
}
