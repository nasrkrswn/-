import { redirect } from "next/navigation";

export default function ControlEntryPage() {
  redirect("/login?type=control");
}
