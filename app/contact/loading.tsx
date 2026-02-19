import { Skeleton } from "@/components/ui/skeleton"

export default function ContactLoading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header skeleton */}
      <div className="bg-muted/50 py-16">
        <div className="container mx-auto px-4">
          <Skeleton className="h-12 w-48 mx-auto mb-4" />
          <Skeleton className="h-6 w-72 mx-auto" />
        </div>
      </div>

      {/* Content skeleton */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 gap-12 max-w-4xl mx-auto">
          {/* Contact form skeleton */}
          <div className="space-y-6">
            <Skeleton className="h-8 w-32" />
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>

          {/* Contact info skeleton */}
          <div className="space-y-6">
            <Skeleton className="h-8 w-40" />
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-start gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
