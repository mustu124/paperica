import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/ui";
import { PasswordForm } from "./password-form";

export const metadata: Metadata = { title: "Set a new password" };

export default function PasswordPage() {
  return (
    <>
      <PageHeader title="Set a new password" description="Choose a password you don't use anywhere else." />
      <PasswordForm />
    </>
  );
}
