import { useTaskManager } from "@/hooks/useTaskManager";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { format, isToday, isYesterday, isThisWeek } from "date-fns";
import { Archive, Check } from "lucide-react";
import { cn } from "@/lib/utils";

function groupLabel(d: Date) {
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  if (isThisWeek(d)) return "This week";
  return format(d, "MMMM yyyy");
}

export default function History() {
  const { completedTasks } = useTaskManager();
  const sorted = [...completedTasks].sort(
    (a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime()
  );

  const groups: { label: string; items: typeof sorted }[] = [];
  sorted.forEach((t) => {
    const label = groupLabel(new Date(t.completedAt!));
    const g = groups.find((x) => x.label === label);
    if (g) g.items.push(t);
    else groups.push({ label, items: [t] });
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6 md:space-y-8 p-4 md:p-8 animate-fade-in">
      <div className="relative overflow-hidden rounded-3xl glass shadow-card p-5 sm:p-7">
        <div aria-hidden className="absolute -top-24 -left-16 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
        <div className="relative">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
            <Archive className="h-3 w-3" />
            Archive
          </div>
          <h1 className="font-display mt-3 text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight leading-[1.05]">
            What you <span className="text-mint-gradient">shipped.</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            <span className="tabular text-foreground font-semibold">{sorted.length}</span> completed tasks in the archive.
          </p>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border py-16 text-center">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-primary/10 grid place-items-center mb-4 ring-1 ring-primary/20">
            <Archive className="h-6 w-6 text-primary" />
          </div>
          <h3 className="font-display text-lg font-semibold">Nothing shipped yet.</h3>
          <p className="mt-1 text-sm text-muted-foreground">Completed tasks will land here.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <section key={group.label} className="space-y-2.5">
              <div className="flex items-center gap-3">
                <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.18em]">
                  {group.label}
                </h2>
                <div className="h-px flex-1 bg-border/60" />
                <span className="text-[11px] tabular text-muted-foreground">{group.items.length}</span>
              </div>

              {group.items.map((t) => {
                const tint = t.color || undefined;
                return (
                  <Card
                    key={t.id}
                    className="relative overflow-hidden rounded-2xl border-border/60 glass shadow-card hover-lift"
                    style={tint ? { backgroundColor: tint, borderColor: "transparent" } : undefined}
                  >
                    <CardContent className="p-4 sm:p-5 flex gap-3 items-start">
                      <div
                        className={cn(
                          "mt-0.5 h-7 w-7 shrink-0 rounded-full grid place-items-center",
                          tint ? "bg-black/25 text-white" : "bg-mint-gradient text-primary-foreground shadow-glow"
                        )}
                      >
                        <Check className="h-3.5 w-3.5" strokeWidth={3} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                          <Badge
                            className={cn(
                              "text-[10px] font-medium h-5 px-2 border-0",
                              tint ? "bg-black/20 text-slate-900" : "bg-primary/15 text-primary"
                            )}
                          >
                            {t.type === "detailed" ? "Detailed" : "Quick"}
                          </Badge>
                          {t.taskCategory && (
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[10px] font-medium h-5 px-2",
                                tint ? "border-slate-900/30 text-slate-900" : "border-border/70 text-muted-foreground"
                              )}
                            >
                              {t.taskCategory}
                            </Badge>
                          )}
                        </div>
                        {t.heading && (
                          <h3 className={cn("font-display font-semibold text-[15px] tracking-tight line-through decoration-2 decoration-primary/40", tint && "text-slate-900 decoration-slate-900/40")}>
                            {t.heading}
                          </h3>
                        )}
                        <p className={cn("text-sm line-through mt-0.5", tint ? "text-slate-800" : "text-foreground/70")}>
                          {t.description}
                        </p>
                        <p className={cn("text-[11px] mt-2 tabular", tint ? "text-slate-700/70" : "text-muted-foreground/80")}>
                          Completed {format(new Date(t.completedAt!), "MMM d · h:mm a")}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}