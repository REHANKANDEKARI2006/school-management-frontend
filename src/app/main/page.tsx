import { redirect } from "next/navigation";

export default function MainPage() {
  // Default entry after login
  redirect("/main/dashboard");
}
