import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/admin/login-form";

export const metadata: Metadata = {
  title: "Admin sign in",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center bg-blush px-4 py-16">
      <div className="w-full max-w-sm rounded-lg bg-white p-8 shadow-sm">
        <h1 className="mb-1 font-display text-3xl text-chilli">Paperica</h1>
        <p className="label-caps mb-8 text-ink-muted">Admin</p>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
