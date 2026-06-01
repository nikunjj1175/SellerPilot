import Link from "next/link";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/lib/site";

function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      aria-hidden
    >
      <rect width="40" height="40" rx="10" className="fill-primary" />
      <path
        d="M11 26V14h4.2c3.1 0 5.1 1.6 5.1 4.2 0 1.8-1 3.2-2.6 3.8l3.4 4h-3.1l-3-3.8H14.2V26H11zm3.2-6.6h1c1.5 0 2.3-.7 2.3-1.9s-.8-1.9-2.3-1.9h-1v3.8z"
        fill="white"
      />
      <path
        d="M22 26l5.2-12h2.9l5.2 12h-3.2l-1-2.6h-5l-1 2.6H22zm4.2-5.2h3.4l-1.7-4.4-1.7 4.4z"
        fill="white"
        opacity="0.95"
      />
      <path
        d="M8 30h24"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.35"
      />
      <path
        d="M10 28l6-8 5 5 9-11"
        stroke="#C4B5FD"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type LogoProps = {
  href?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "onDark";
  className?: string;
  onClick?: () => void;
};

const sizes = {
  sm: { mark: "h-8 w-8", title: "text-sm", tag: "text-[9px]" },
  md: { mark: "h-10 w-10", title: "text-base", tag: "text-[10px]" },
  lg: { mark: "h-12 w-12", title: "text-lg", tag: "text-xs" },
};

export function Logo({
  href = "/",
  showText = true,
  size = "md",
  variant = "default",
  className,
  onClick,
}: LogoProps) {
  const s = sizes[size];
  const onDark = variant === "onDark";
  const inner = (
    <>
      <LogoMark className={s.mark} />
      {showText && (
        <div className="min-w-0 leading-tight">
          <span
            className={cn(
              "block font-semibold truncate",
              s.title,
              onDark ? "text-white" : "text-foreground"
            )}
          >
            {siteConfig.name}
          </span>
          <span
            className={cn(
              "block truncate",
              s.tag,
              onDark ? "text-white/65" : "text-muted-foreground"
            )}
          >
            {siteConfig.tagline}
          </span>
        </div>
      )}
    </>
  );

  const wrap = cn("flex items-center gap-2.5 min-w-0", className);

  if (href) {
    return (
      <Link href={href} className={wrap} onClick={onClick}>
        {inner}
      </Link>
    );
  }

  return (
    <div className={wrap} onClick={onClick} role={onClick ? "button" : undefined}>
      {inner}
    </div>
  );
}

export { LogoMark };
