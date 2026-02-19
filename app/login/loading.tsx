import { Skeleton } from "@/components/ui/skeleton"

export default function LoginLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-8">
        <Skeleton className="h-10 w-1/2 mx-auto mb-6" />
        <Skeleton className="h-12 w-full mb-4" />
        <Skeleton className="h-12 w-full mb-4" />
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  )
}
