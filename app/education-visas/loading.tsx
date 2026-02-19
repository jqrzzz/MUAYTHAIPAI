import { Skeleton } from "@/components/ui/skeleton"

export default function EducationVisasLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-10 w-1/2 mb-6" />
        <Skeleton className="h-48 w-full mb-4" />
        <Skeleton className="h-64 w-full mb-4" />
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
  )
}
