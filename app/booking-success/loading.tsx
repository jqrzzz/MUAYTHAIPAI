import { Skeleton } from "@/components/ui/skeleton"

export default function BookingSuccessLoading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-card rounded-lg p-8 space-y-6">
        <div className="flex justify-center">
          <Skeleton className="h-16 w-16 rounded-full" />
        </div>
        <Skeleton className="h-8 w-48 mx-auto" />
        <Skeleton className="h-4 w-64 mx-auto" />
        <div className="space-y-3 pt-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  )
}
