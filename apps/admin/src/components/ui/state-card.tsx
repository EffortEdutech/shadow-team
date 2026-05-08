type StateTone = "neutral" | "warning" | "danger";

const toneClassName: Record<StateTone, string> = {
  neutral: "border-border bg-panel text-muted",
  warning: "border-warning/30 bg-warning/5 text-warning",
  danger: "border-danger/30 bg-danger/5 text-danger",
};

export function StateCard({
  title,
  description,
  tone = "neutral",
}: {
  title: string;
  description: string;
  tone?: StateTone;
}) {
  return (
    <section className={`rounded-lg border p-4 text-sm ${toneClassName[tone]}`}>
      <p className="font-medium text-foreground">{title}</p>
      <p className="mt-1 leading-6">{description}</p>
    </section>
  );
}

