import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ProfilePanel } from "./ProfilePanel";

export const metadata = {
  title: "Profile",
};

export default function ProfilePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar variant="app" />
      <main className="flex-1 px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <p className="label-caps text-surface-tint">Account</p>
          <h1 className="font-heading text-h2 text-on-background">Operator profile</h1>
          <p className="mt-2 text-on-surface-variant">
            Manage identity metadata, notification routing, and session preferences for the EventFlow console.
          </p>
          <div className="mt-10">
            <ProfilePanel />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
