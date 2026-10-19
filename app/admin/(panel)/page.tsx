import { redirect } from "next/navigation";

/** No dashboard: the admin opens on Orders. */
export default function AdminHome() {
  redirect("/admin/orders");
}
