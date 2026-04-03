import { redirect } from "next/navigation"

// Redirect /login to the student login page (the primary signup flow)
export default function LoginPage() {
  redirect("/student/login")
}
