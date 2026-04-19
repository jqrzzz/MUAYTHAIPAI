"use client"

export function PrivacyPolicyClient() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white dark:from-orange-900/20 dark:to-black">
      <div className="container mx-auto px-4 py-16">
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
    </div>
  )
}
