"use client";

import { useState } from "react";
import { ImageUpload } from "@/components/admin/image-upload";
import { Card, Field, inputCls, Toggle } from "@/components/admin/ui";
import { useSave } from "@/components/admin/use-save";
import { Button } from "@/components/ui/button";
import { SETTINGS_GROUPS } from "@/lib/admin/settings-fields";
import { cn } from "@/lib/cn";
import { saveSettings } from "./actions";

export function SettingsForm({ initial }: { initial: Record<string, string | boolean> }) {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { run, pending } = useSave();
  const set = (key: string, value: string | boolean) => {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors(({ [key]: _gone, ...rest }) => {
      void _gone;
      return rest;
    });
  };

  return (
    <form
      noValidate
      className="space-y-6 pb-24"
      onSubmit={(e) => {
        e.preventDefault();
        void run(() => saveSettings(values), "Settings saved").then((r) => {
          const fieldErrors = "errors" in r ? (r.errors as Record<string, string>) : undefined;
          setErrors(fieldErrors ?? {});
          if (fieldErrors) document.querySelector<HTMLElement>("[aria-invalid=true]")?.focus();
        });
      }}
    >
      {SETTINGS_GROUPS.map((group) => (
        <Card key={group.title} title={group.title} description={group.description}>
          <div className={cn("grid gap-4", group.fields.some((f) => f.type === "image") ? "sm:grid-cols-2 lg:grid-cols-3" : "md:grid-cols-2")}>
            {group.fields.map((f) => {
              const value = values[f.key];
              const error = errors[f.key];
              if (f.type === "bool")
                return (
                  <div key={f.key} className="md:col-span-2">
                    <Toggle checked={value === true} onChange={(v) => set(f.key, v)} label={f.label} />
                  </div>
                );
              if (f.type === "image")
                return (
                  <div key={f.key} className="max-w-xs">
                    <ImageUpload
                      value={typeof value === "string" && value ? value : null}
                      onChange={(url) => set(f.key, url ?? "")}
                      folder="branding"
                      label={f.label}
                      aspect={f.aspect}
                      format={f.format}
                      contain
                    />
                    {f.hint && <p className="mt-1.5 text-xs text-ink-muted">{f.hint}</p>}
                    {error && (
                      <p role="alert" className="mt-1 text-xs text-chilli">
                        {error}
                      </p>
                    )}
                  </div>
                );
              const common = {
                value: String(value ?? ""),
                "aria-invalid": Boolean(error),
                className: cn(inputCls, error && "border-chilli"),
              };
              return (
                <Field key={f.key} label={f.label} hint={f.hint} error={error} className={f.type === "textarea" ? "md:col-span-2" : undefined}>
                  {f.type === "textarea" ? (
                    <textarea rows={3} {...common} onChange={(e) => set(f.key, e.target.value)} />
                  ) : (
                    <input
                      {...common}
                      type={f.type === "email" ? "email" : f.type === "url" ? "url" : "text"}
                      inputMode={f.type === "number" || f.type === "optional_number" || f.type === "whatsapp" ? "numeric" : undefined}
                      placeholder={f.type === "url" ? "https://" : undefined}
                      onChange={(e) => set(f.key, f.type === "whatsapp" ? e.target.value.replace(/[^\d]/g, "") : e.target.value)}
                    />
                  )}
                </Field>
              );
            })}
          </div>
        </Card>
      ))}

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-taupe bg-white/95 px-4 py-3 backdrop-blur lg:left-64">
        <div className="mx-auto flex max-w-6xl justify-end md:px-4">
          <Button type="submit" size="lg" disabled={pending} className="min-w-40">
            {pending ? "Saving…" : "Save settings"}
          </Button>
        </div>
      </div>
    </form>
  );
}
