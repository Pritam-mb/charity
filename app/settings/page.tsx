import { getCurrentUser } from "@/lib/auth";
import SettingsForm from "@/components/settings-form";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  return (
    <div className="settings-page-wrapper">
      <SettingsForm user={user} />
    </div>
  );
}
