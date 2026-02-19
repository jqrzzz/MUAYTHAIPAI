import { Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Calendar, Mail, Phone, MapPin } from "lucide-react"
import Link from "next/link"

function BookingSuccessContent() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center pb-4 md:pb-6">
          <div className="mx-auto mb-3 md:mb-4 w-12 h-12 md:w-16 md:h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="h-6 w-6 md:h-8 md:w-8 text-green-600" />
          </div>
          <CardTitle className="text-xl md:text-2xl text-green-800">Booking Confirmed!</CardTitle>
          <CardDescription className="text-base md:text-lg">
            Your Muay Thai training session has been successfully booked
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 md:space-y-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 md:p-6">
            <h3 className="font-semibold text-green-800 mb-2 md:mb-3 text-sm md:text-base">What happens next?</h3>
            <ul className="space-y-1.5 md:space-y-2 text-green-700 text-sm md:text-base">
              <li className="flex items-start gap-2">
                <Mail className="h-3.5 w-3.5 md:h-4 md:w-4 mt-0.5 flex-shrink-0" />
                <span>You'll receive a confirmation email within 5 minutes</span>
              </li>
              <li className="flex items-start gap-2">
                <Phone className="h-3.5 w-3.5 md:h-4 md:w-4 mt-0.5 flex-shrink-0" />
                <span>Our team will contact you within 24 hours to confirm details</span>
              </li>
              <li className="flex items-start gap-2">
                <Calendar className="h-3.5 w-3.5 md:h-4 md:w-4 mt-0.5 flex-shrink-0" />
                <span>Arrive 15 minutes early for your first session</span>
              </li>
            </ul>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 md:p-6">
            <h3 className="font-semibold text-orange-800 mb-2 md:mb-3 flex items-center gap-2 text-sm md:text-base">
              <MapPin className="h-3.5 w-3.5 md:h-4 md:w-4" />
              Gym Location
            </h3>
            <div className="text-orange-700 text-sm md:text-base">
              <p className="font-medium">Muay Thai Pai</p>
              <p>123 Training Street</p>
              <p>Pai, Mae Hong Son 58130</p>
              <p>Thailand</p>
            </div>
            <Button asChild className="mt-3 md:mt-4 bg-orange-600 hover:bg-orange-700 text-sm md:text-base h-9 md:h-10">
              <Link href="https://maps.google.com" target="_blank">
                Get Directions
              </Link>
            </Button>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 md:p-6">
            <h3 className="font-semibold text-blue-800 mb-2 md:mb-3 text-sm md:text-base">What to Bring</h3>
            <ul className="text-blue-700 space-y-0.5 md:space-y-1 text-sm md:text-base">
              <li>• Comfortable workout clothes</li>
              <li>• Water bottle</li>
              <li>• Towel</li>
              <li>• Positive attitude and willingness to learn!</li>
            </ul>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 md:p-6">
            <h3 className="font-semibold text-gray-800 mb-2 md:mb-3 text-sm md:text-base">Need Help?</h3>
            <div className="text-gray-700 space-y-1 md:space-y-2 text-sm md:text-base">
              <p>📧 Email: help@muaythaipai.com</p>
              <p>📱 WhatsApp: +66 123 456 789</p>
              <p>☎️ Phone: +66 123 456 789</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
            <Button asChild variant="outline" className="flex-1 bg-transparent text-sm md:text-base h-9 md:h-10">
              <Link href="/">Return Home</Link>
            </Button>
            <Button asChild className="flex-1 bg-orange-600 hover:bg-orange-700 text-sm md:text-base h-9 md:h-10">
              <Link href="/classes">View All Classes</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function BookingSuccessPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BookingSuccessContent />
    </Suspense>
  )
}
