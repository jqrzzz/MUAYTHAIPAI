import { Skeleton } from "@/components/ui/skeleton"

export default function FightersLoading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header skeleton */}
      <div className="bg-muted/50 py-16">
        <div className="container mx-auto px-4">
          <Skeleton className="h-12 w-48 mx-auto mb-4" />
          <Skeleton className="h-6 w-80 mx-auto" />
        </div>
      </div>

      {/* Fighters grid skeleton */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-card rounded-lg overflow-hidden">
              <Skeleton className="h-64 w-full" />
              <div className="p-6 space-y-3">
                <Skeleton className="h-6 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-16 rounded-full" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
