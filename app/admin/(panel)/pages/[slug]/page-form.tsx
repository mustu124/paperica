"use client";

import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { useState, type ReactNode } from "react";
import { RichText } from "@/components/admin/rich-text";
import { Card, Field, inputCls } from "@/components/admin/ui";
import { useSave } from "@/components/admin/use-save";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { saveAbout, savePage } from "../actions";

type Token = { token: string; meaning: string; value: string };

function TokenPanel({ tokens }: { tokens: Token[] }) {
  const { toast } = useToast();
  return (
    <Card title="Tokens" description="Type these in the text — they're replaced with your current settings, so a change in Site Settings updates every page. Click to copy." className="lg:sticky lg:top-6">
      <ul className="max-h-[60vh] space-y-1.5 overflow-y-auto text-sm">
        {tokens.map((t) => (
          <li key={t.token}>
            <button
              type="button"
              onClick={async () => {
                await navigator.clipboard.writeText(`{{${t.token}}}`);
                toast(`Copied {{${t.token}}}`, "success");
              }}
              className="w-full rounded-md px-2 py-1.5 text-left hover:bg-blush/40"
            >
              <code className="text-xs text-chilli-deep">{`{{${t.token}}}`}</code>
              <span className="block text-xs text-ink-muted">
                {t.meaning}: <span className="text-ink">{t.value || "—"}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function Shell({ title, path, tokens, children, pending }: { title: string; path: string; tokens: Token[]; children: ReactNode; pending: boolean }) {
  return (
    <div className="space-y-6 pb-24">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href="/admin/pages" className="inline-flex min-h-11 items-center gap-1 text-sm text-ink-muted hover:text-chilli lg:min-h-0">
            <ArrowLeft className="size-4" aria-hidden /> Pages & FAQs
          </Link>
          <h1 className="mt-1 font-serif text-3xl font-semibold">{title}</h1>
        </div>
        <a href={path} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-1.5 rounded-md border border-ink/25 bg-white px-3 text-sm lg:min-h-0 lg:py-2 hover:border-chilli hover:text-chilli">
          <ExternalLink className="size-4" aria-hidden /> View page
        </a>
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="space-y-6">{children}</div>
        <div>
          <TokenPanel tokens={tokens} />
        </div>
      </div>
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-taupe bg-white/95 px-4 py-3 backdrop-blur lg:left-64">
        <div className="mx-auto flex max-w-6xl justify-end md:px-4">
          <Button type="submit" size="lg" disabled={pending} className="min-w-40">
            {pending ? "Saving…" : "Save page"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function PageForm({
  slug,
  label,
  path,
  enquiry,
  tokens,
  initial,
}: {
  slug: string;
  label: string;
  path: string;
  enquiry: boolean;
  tokens: Token[];
  initial: { title: string; body_html: string; effective_date: string | null; cta_label: string; cta_whatsapp_message: string; cta_email_subject: string };
}) {
  const [v, setV] = useState(initial);
  const { run, pending } = useSave();
  const set = <K extends keyof typeof v>(k: K, value: (typeof v)[K]) => setV((s) => ({ ...s, [k]: value }));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void run(() => savePage(slug, v), "Page saved");
      }}
    >
      <Shell title={label} path={path} tokens={tokens} pending={pending}>
        <Card>
          <div className="grid gap-4 sm:grid-cols-[1fr_12rem]">
            <Field label="Title">
              <input value={v.title} onChange={(e) => set("title", e.target.value)} className={inputCls} />
            </Field>
            <Field label="“Last updated” date" hint="Shown under the title. Leave empty to hide.">
              <input type="date" value={v.effective_date ?? ""} onChange={(e) => set("effective_date", e.target.value || null)} className={inputCls} />
            </Field>
          </div>
        </Card>
        {enquiry && (
          <Card title="Enquiry buttons" description="The big WhatsApp button and the Email button on this page.">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="WhatsApp button label">
                <input value={v.cta_label} onChange={(e) => set("cta_label", e.target.value)} placeholder="Enquire on WhatsApp" className={inputCls} />
              </Field>
              <Field label="Email subject">
                <input value={v.cta_email_subject} onChange={(e) => set("cta_email_subject", e.target.value)} className={inputCls} />
              </Field>
              <Field label="Pre-filled WhatsApp message" className="sm:col-span-2">
                <textarea rows={6} value={v.cta_whatsapp_message} onChange={(e) => set("cta_whatsapp_message", e.target.value)} className={inputCls} />
              </Field>
            </div>
          </Card>
        )}
        <div className="space-y-1.5 text-sm">
          <span className="font-medium">Page text</span>
          <RichText value={v.body_html} onChange={(html) => set("body_html", html)} minHeight="min-h-[28rem]" />
        </div>
      </Shell>
    </form>
  );
}

export function AboutForm({
  path,
  tokens,
  initial,
}: {
  path: string;
  tokens: Token[];
  initial: { title: string; about_intro_html: string; founder_story_html: string; mission_html: string };
}) {
  const [v, setV] = useState(initial);
  const { run, pending } = useSave();
  const set = <K extends keyof typeof v>(k: K, value: string) => setV((s) => ({ ...s, [k]: value }));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void run(() => saveAbout(v), "About page saved");
      }}
    >
      <Shell title="About" path={path} tokens={tokens} pending={pending}>
        <Card>
          <Field label="Title">
            <input value={v.title} onChange={(e) => set("title", e.target.value)} className={inputCls} />
          </Field>
        </Card>
        <div className="space-y-1.5 text-sm">
          <span className="font-medium">Intro (top of the page)</span>
          <RichText value={v.about_intro_html} onChange={(h) => set("about_intro_html", h)} />
        </div>
        <div className="space-y-1.5 text-sm">
          <span className="font-medium">Our Story (keep the heading at the top)</span>
          <RichText value={v.founder_story_html} onChange={(h) => set("founder_story_html", h)} />
        </div>
        <div className="space-y-1.5 text-sm">
          <span className="font-medium">Our Mission (keep the heading at the top)</span>
          <RichText value={v.mission_html} onChange={(h) => set("mission_html", h)} />
        </div>
      </Shell>
    </form>
  );
}
