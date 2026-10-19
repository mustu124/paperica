"use client";

import { useActionState, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { login, requestPasswordReset, type LoginState } from "@/app/admin/actions";
import { inputCls } from "./ui";

const PROXY_ERRORS: Record<string, string> = {
  not_authorised: "This account doesn't have access to the shop admin. Sign in with the owner's email.",
  link_expired: "That reset link has expired or was already used. Request a new one below.",
};

export function LoginForm() {
  const searchParams = useSearchParams();
  const [state, formAction, pending] = useActionState<LoginState, FormData>(login, {});
  const [email, setEmail] = useState("");
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [resetting, startReset] = useTransition();
  const error = state.error ?? PROXY_ERRORS[searchParams.get("error") ?? ""] ?? null;

  return (
    <div className="space-y-5">
      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="next" value={searchParams.get("next") ?? ""} />

        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Email
          <input
            name="email"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputCls}
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Password
          <input name="password" type="password" autoComplete="current-password" required className={inputCls} />
        </label>

        {error && (
          <p role="alert" className="rounded-md bg-blush/60 px-3 py-2 text-sm text-chilli-deep">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="label-button h-12 rounded-md bg-chilli px-4 text-white hover:bg-chilli-deep disabled:opacity-60"
        >
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <div className="text-center text-sm">
        {resetMessage ? (
          <p role="status" className="text-ink-muted">
            {resetMessage}
          </p>
        ) : (
          <button
            type="button"
            disabled={resetting}
            onClick={() =>
              startReset(async () => {
                if (!email) {
                  setResetMessage("Type your email above first, then tap “Forgot your password?” again.");
                  return;
                }
                setResetMessage((await requestPasswordReset(email)).message);
              })
            }
            className="text-ink-muted underline underline-offset-4 hover:text-chilli"
          >
            {resetting ? "Sending…" : "Forgot your password?"}
          </button>
        )}
      </div>
    </div>
  );
}
