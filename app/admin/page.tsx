import { redirect } from "next/navigation";

export const metadata = {
  title: "Admin Dashboard | Cinevero",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  redirect("/admin/indexing");
}
