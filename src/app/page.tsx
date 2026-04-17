import { redirect } from "next/navigation";

// Root route: redirect to dashboard (ProtectedRoute handles auth)
export default function RootPage() {
  redirect("/dashboard");
}
