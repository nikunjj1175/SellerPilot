import Link from "next/link";

type ReportOption = {
  id: string;
  name: string;
};

export function ReportPicker({
  reports,
  selectedId,
  basePath,
  linkMode = "query",
}: {
  reports: ReportOption[];
  selectedId?: string;
  basePath: string;
  linkMode?: "query" | "path";
}) {
  if (!reports.length) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {reports.map((r) => (
        <Link
          key={r.id}
          href={linkMode === "path" ? `${basePath}/${r.id}` : `${basePath}?report=${r.id}`}
          className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
            selectedId === r.id
              ? "border-primary bg-primary/10 text-primary font-medium"
              : "border-border hover:border-primary/40"
          }`}
        >
          {r.name}
        </Link>
      ))}
    </div>
  );
}
