import { Loader2 } from "lucide-react";
import useAuth from "@/lib/use-auth";
import ProfileContent from "@/components/auth0/profile/profile-content";

export default function ProfilePage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-full">
        <Loader2 className="h-8 w-8 animate-spin text-white/60" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-full">
        <p className="text-white/60">Please log in to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-white/5">
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Profile</h1>
          <p className="text-white/70">Manage your connected accounts</p>
        </div>

        <ProfileContent user={user} />
      </div>
    </div>
  );
}
