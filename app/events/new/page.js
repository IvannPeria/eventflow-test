import { Suspense } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { NewEventForm } from "./NewEventForm";

export const metadata = {
  title: "Create event",
};

export default function NewEventPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background text-on-surface-variant">
          Loading…
        </div>
      }
    >
      <RequireAuth>
        <div className="flex min-h-screen flex-col bg-background">
          <Navbar variant="app" />
          <main className="flex-1 px-4 py-10 sm:px-6">
            <div className="mx-auto w-full max-w-2xl">
              <p className="label-caps text-surface-tint">New program</p>
              <h1 className="font-heading text-h2 text-on-background">Create event</h1>
              <p className="mt-2 text-on-surface-variant">
                Define the core logistics profile. All fields marked required must be completed before publishing.
              </p>
              <div className="mt-10">
                <NewEventForm />
              </div>
            </div>
          </main>
          <Footer />
        </div>
      </RequireAuth>
    </Suspense>
  );
}
