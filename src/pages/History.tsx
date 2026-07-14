import { useTaskManager } from "@/hooks/useTaskManager";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";

export default function History() {
  const { completedTasks } = useTaskManager();
  const sorted = [...completedTasks].sort(
    (a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime()
  );

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 md:p-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">History</h1>
        <p className="text-sm text-muted-foreground">{sorted.length} completed tasks</p>
      </div>

      {sorted.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">No completed tasks yet.</p>
      ) : (
        <div className="space-y-3">
          {sorted.map((t) => {
            const tint = t.color || undefined;
            return (
              <Card
                key={t.id}
                className="transition-shadow hover:shadow-md overflow-hidden"
                style={tint ? { backgroundColor: tint, borderColor: tint } : undefined}
              >
                <CardContent className="p-4 flex gap-3">
                  {tint && (
                    <span
                      aria-hidden
                      className="w-1.5 shrink-0 rounded-full bg-black/25 self-stretch"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Badge variant={t.type === "detailed" ? "default" : "secondary"} className="text-[10px]">
                        {t.type === "detailed" ? "Detailed" : "Normal"}
                      </Badge>
                      {t.taskCategory && (
                        <Badge variant="outline" className="text-[10px]">{t.taskCategory}</Badge>
                      )}
                    </div>
                    {t.heading && (
                      <h3 className={`font-semibold text-sm ${tint ? "text-slate-900" : ""}`}>{t.heading}</h3>
                    )}
                    <p className={`text-sm mt-0.5 ${tint ? "text-slate-800" : "text-foreground/80"}`}>
                      {t.description}
                    </p>
                    <p className={`text-[11px] mt-1 ${tint ? "text-slate-700/80" : "text-muted-foreground"}`}>
                      Completed {format(new Date(t.completedAt!), "MMM d, yyyy · h:mm a")}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
