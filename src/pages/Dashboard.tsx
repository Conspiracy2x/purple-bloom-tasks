import { useEffect, useRef } from "react";
import { animateCount } from "@/lib/motion";
import { useTaskManager } from "@/hooks/useTaskManager";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, CalendarCheck, Trophy, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

export default function Dashboard() {
  const { completedToday, completedThisWeek, totalCompleted, completedTasks } = useTaskManager();

  const categoryData = completedTasks.reduce<Record<string, number>>((acc, t) => {
    const cat = t.taskCategory ?? (t.type === "normal" ? "Quick" : "Other");
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  const chartData = Object.entries(categoryData)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const stats = [
    { label: "Today", value: completedToday, icon: CheckCircle2, hint: "Wins in the last 24h" },
    { label: "This Week", value: completedThisWeek, icon: CalendarCheck, hint: "Since Sunday" },
    { label: "All-time", value: totalCompleted, icon: Trophy, hint: "Total completed" },
  ];

  const numRefs = useRef<(HTMLSpanElement | null)[]>([]);
  useEffect(() => {
    const cleanups = stats.map((s, i) =>
      animateCount(numRefs.current[i], s.value, { delay: i * 0.08 })
    );
    return () => cleanups.forEach((fn) => fn());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completedToday, completedThisWeek, totalCompleted]);

  return (
    <div className="mx-auto max-w-4xl space-y-6 md:space-y-8 p-4 md:p-8 animate-fade-in">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl glass shadow-card p-5 sm:p-7">
        <div aria-hidden className="absolute -top-24 -right-16 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
        <div className="relative">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
            <TrendingUp className="h-3 w-3" />
            Momentum
          </div>
          <h1 className="font-display mt-3 text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight leading-[1.05]">
            Progress, <span className="text-mint-gradient">measured.</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground max-w-md">
            The rhythm of shipping. Small consistent wins.
          </p>
        </div>
      </div>

      {/* Stat grid */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
        {stats.map((s, i) => (
          <Card
            key={s.label}
            className="relative overflow-hidden rounded-2xl glass shadow-card hover-lift"
          >
            <div
              aria-hidden
              className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent"
            />
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                    {s.label}
                  </p>
                  <span
                    ref={(el) => (numRefs.current[i] = el)}
                    className="mt-2 block tabular text-4xl sm:text-5xl font-semibold text-mint-gradient leading-none"
                  >
                    0
                  </span>
                  <p className="mt-2 text-xs text-muted-foreground">{s.hint}</p>
                </div>
                <div className="h-9 w-9 rounded-xl bg-primary/10 grid place-items-center ring-1 ring-primary/20">
                  <s.icon className="h-4 w-4 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <Card className="rounded-2xl glass shadow-card">
          <CardContent className="p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-display text-lg font-semibold tracking-tight">By Category</h3>
                <p className="text-xs text-muted-foreground">Where your finished work lives</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="barMint" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary-glow))" />
                    <stop offset="100%" stopColor="hsl(var(--primary))" />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: "hsl(var(--primary) / 0.06)" }}
                  contentStyle={{
                    background: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="count" radius={[8, 8, 0, 0]} fill="url(#barMint)">
                  {chartData.map((_, i) => (
                    <Cell key={i} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
