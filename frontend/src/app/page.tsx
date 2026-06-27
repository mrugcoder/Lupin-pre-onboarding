import { redirect } from "next/navigation";

/**
 * Root page — redirects to /dashboard.
 * The dashboard layout will redirect to /login if no token is present.
 */
export default function RootPage() {
  redirect("/dashboard");
}
