import AdminDashboard from "./AdminDashboardV2";

export const metadata = {
  title: "Admin Dashboard | Cinevero",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminDashboard />;
}
