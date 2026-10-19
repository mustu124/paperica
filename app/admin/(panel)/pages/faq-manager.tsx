"use client";

import { ArrowDown, ArrowUp, ChevronDown, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { RichText } from "@/components/admin/rich-text";
import { Card, Field, inputCls, StatusBadge, Toggle } from "@/components/admin/ui";
import { useSave } from "@/components/admin/use-save";
import { Button } from "@/components/ui/button";
import { deleteFaq, moveFaq, saveFaq } from "./actions";

type Faq = { id: string; group: string; question: string; answer: string; active: boolean };

function FaqEditor({
  faq,
  groups,
  onDone,
}: {
  faq: Faq | null;
  groups: string[];
  onDone: () => void;
}) {
  const [group, setGroup] = useState(faq?.group ?? groups[0] ?? "");
  const [question, setQuestion] = useState(faq?.question ?? "");
  const [answer, setAnswer] = useState(faq?.answer ?? "");
  const [active, setActive] = useState(faq?.active ?? true);
  const { run, pending } = useSave();
  const listId = `faq-groups-${faq?.id ?? "new"}`;

  return (
    <form
      className="space-y-4 rounded-md bg-paper/40 p-4"
      onSubmit={(e) => {
        e.preventDefault();
        void run(() => saveFaq(faq?.id ?? null, { group_name: group, question, answer_html: answer, is_active: active }), faq ? "Question saved" : "Question added").then(
          (r) => r.ok && onDone(),
        );
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Group" hint="Pick a group or type a new one.">
          <input value={group} onChange={(e) => setGroup(e.target.value)} list={listId} className={inputCls} />
          <datalist id={listId}>
            {groups.map((g) => (
              <option key={g} value={g} />
            ))}
          </datalist>
        </Field>
        <div className="flex items-end pb-2">
          <Toggle checked={active} onChange={setActive} label="Show on the FAQ page" />
        </div>
      </div>
      <Field label="Question">
        <input value={question} onChange={(e) => setQuestion(e.target.value)} className={inputCls} />
      </Field>
      <div className="space-y-1.5 text-sm">
        <span className="font-medium">Answer</span>
        <RichText value={answer} onChange={setAnswer} minHeight="min-h-24" />
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : faq ? "Save question" : "Add question"}
        </Button>
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

export function FaqManager({ faqs }: { faqs: Faq[] }) {
  const [editing, setEditing] = useState<string | null>(null); // faq id or "new"
  const { run, pending } = useSave();
  const groups = [...new Set(faqs.map((f) => f.group))];

  return (
    <Card
      title="FAQs"
      description="Grouped as they appear on the Help Centre page."
      actions={
        editing !== "new" && (
          <Button size="sm" onClick={() => setEditing("new")}>
            <Plus className="size-4" aria-hidden /> Add question
          </Button>
        )
      }
    >
      {editing === "new" && (
        <div className="mb-6">
          <FaqEditor faq={null} groups={groups} onDone={() => setEditing(null)} />
        </div>
      )}
      <div className="space-y-8">
        {groups.map((g) => {
          const items = faqs.filter((f) => f.group === g);
          return (
            <section key={g}>
              <h3 className="mb-2 font-serif text-lg font-semibold">{g}</h3>
              <ul className="divide-y divide-taupe/70 rounded-md border border-taupe">
                {items.map((f, i) => (
                  <li key={f.id} className="p-3">
                    {editing === f.id ? (
                      <FaqEditor faq={f} groups={groups} onDone={() => setEditing(null)} />
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="flex gap-1">
                          <button type="button" disabled={pending || i === 0} onClick={() => run(() => moveFaq(f.id, "up"), "Moved")} aria-label="Move up" className="inline-flex min-h-11 min-w-11 items-center justify-center lg:min-h-0 lg:min-w-0 rounded border border-ink/20 p-1 disabled:opacity-30">
                            <ArrowUp className="size-4" aria-hidden />
                          </button>
                          <button type="button" disabled={pending || i === items.length - 1} onClick={() => run(() => moveFaq(f.id, "down"), "Moved")} aria-label="Move down" className="inline-flex min-h-11 min-w-11 items-center justify-center lg:min-h-0 lg:min-w-0 rounded border border-ink/20 p-1 disabled:opacity-30">
                            <ArrowDown className="size-4" aria-hidden />
                          </button>
                        </div>
                        <button type="button" onClick={() => setEditing(f.id)} className="flex min-h-11 flex-1 items-center justify-between gap-3 text-left hover:text-chilli">
                          <span>{f.question}</span>
                          <ChevronDown className="size-4 shrink-0" aria-hidden />
                        </button>
                        {!f.active && <StatusBadge status="inactive" label="Hidden" />}
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => window.confirm("Delete this question?") && run(() => deleteFaq(f.id), "Question deleted")}
                          aria-label={`Delete “${f.question}”`}
                          className="inline-flex min-h-11 min-w-11 items-center justify-center lg:min-h-0 lg:min-w-0 rounded border border-ink/20 p-1 text-chilli"
                        >
                          <Trash2 className="size-4" aria-hidden />
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </Card>
  );
}
