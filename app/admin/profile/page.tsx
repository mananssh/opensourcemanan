import { getProfile } from "@/lib/portfolio/queries";
import { ProfileForm } from "@/components/portfolio/admin/profile-form";

export default async function AdminProfilePage() {
  const profile = await getProfile();
  return (
    <div>
      <h1 className="mb-6 font-display text-3xl font-semibold text-ink">Profile</h1>
      <ProfileForm profile={profile} />
    </div>
  );
}
