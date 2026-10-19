"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updatePassword } from "@/app/admin/actions";
import { Card, Field, inputCls } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

export function PasswordForm() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  return (
    <Card className="max-w-md">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          start(async () => {
            const r = await updatePassword({ password, confirm });
            if (r.ok) {
              toast("Password updated", "success");
              router.push("/admin/orders");
            } else setError(r.error ?? "Couldn't update the password.");
          });
        }}
      >
        <Field label="New password" hint="At least 10 characters.">
          <input type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Type it again" error={error ?? undefined}>
          <input type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputCls} />
        </Field>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save password"}
        </Button>
      </form>
    </Card>
  );
}
