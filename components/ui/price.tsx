import { formatINR } from "@/lib/format";
import { cn } from "@/lib/cn";

/**
 * Shows the price, plus the struck-through compare-at price when it is higher.
 * `prefix` (e.g. "From") is for customisable products; a null amount shows `emptyLabel`.
 */
export function Price({
  amount,
  compareAt,
  prefix,
  emptyLabel = "Enquire for price",
  size = "sm",
  className,
}: {
  amount: number | string | null;
  compareAt?: number | string | null;
  prefix?: string;
  emptyLabel?: string;
  size?: "sm" | "lg";
  className?: string;
}) {
  const cls = cn(
    "flex flex-wrap items-baseline justify-center gap-x-2",
    size === "lg" ? "text-xl" : "text-sm",
    className,
  );

  if (amount == null) return <p className={cn(cls, "text-ink-muted")}>{emptyLabel}</p>;

  const onSale = compareAt != null && Number(compareAt) > Number(amount);
  return (
    <p className={cls}>
      {onSale ? (
        <>
          <span className="sr-only">Sale price</span>
          <span className="text-chilli">
            {prefix && `${prefix} `}
            {formatINR(amount)}
          </span>
          <span className="sr-only">Regular price</span>
          <s className="text-ink-muted">{formatINR(compareAt)}</s>
        </>
      ) : (
        <span>
          {prefix && `${prefix} `}
          {formatINR(amount)}
        </span>
      )}
    </p>
  );
}
