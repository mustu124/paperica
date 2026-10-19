import type { SocialLink } from "@/lib/settings";
import { cn } from "@/lib/cn";

// Simple outline brand marks (lucide-react no longer ships brand icons).
function Icon({ network, className }: { network: SocialLink["network"]; className?: string }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    className: cn("size-4", className),
  };
  switch (network) {
    case "instagram":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <path d="M17.5 6.5h.01" />
        </svg>
      );
    case "facebook":
      return (
        <svg {...common}>
          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
        </svg>
      );
    case "pinterest":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="10" />
          <path d="M9.5 21 12 11" />
          <path d="M9.7 14.2c.6.6 1.5 1 2.6 1 2.6 0 4.2-2.1 4.2-4.7C16.5 7.9 14.4 6 11.8 6 8.9 6 7 8.1 7 10.6c0 .9.3 1.8.9 2.4" />
        </svg>
      );
  }
}

export function SocialLinks({
  links,
  className,
  iconClassName,
}: {
  links: SocialLink[];
  className?: string;
  iconClassName?: string;
}) {
  if (links.length === 0) return null;
  return (
    <ul className={cn("flex items-center gap-3", className)}>
      {links.map((s) => (
        <li key={s.network}>
          <a
            href={s.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Paperica on ${s.label} (opens in a new tab)`}
            className="flex size-11 items-center justify-center transition-colors hover:text-chilli-deep lg:size-auto lg:p-1"
          >
            <Icon network={s.network} className={iconClassName} />
          </a>
        </li>
      ))}
    </ul>
  );
}
