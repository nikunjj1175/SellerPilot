import { redirect } from "next/navigation";

/** Home dashboard removed — sellers land on My Reports */
export default function DashboardPage() {
  redirect("/dashboard/reports");
}
