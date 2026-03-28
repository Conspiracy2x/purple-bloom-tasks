import { useTaskManager } from "@/hooks/useTaskManager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, CalendarCheck, Trophy } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

export default function Dashboard() {
  const { completedToday, completedThisWeek, totalCompleted, completedTasks } = useTaskManager();

  const categoryData = completedTasks.reduce<Record<string, number>>((acc, t) => {
    const cat = t.taskCategory ?? (t.type === "normal" ? "Quick" : "Other");
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  const chartData = Object.entries(categoryData).map(([name, count]) => ({ name, count }));
  const colors = [
    "hsl(262, 60%, 58%)",
    "hsl(270, 40%, 75%)",
    "hsl(280, 50%, 65%)",
    "hsl(290, 35%, 70%)",
    "hsl(250, 45%, 65%)",
  ];

  const stats = [
    { label: "Today", value: completedToday, icon: CheckCircle2 },
    { label: "This Week", value: completedThisWeek, icon: CalendarCheck },
    { label: "Total", value: totalCompleted, icon: Trophy },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-4 md:p-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Your productivity at a glance</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label} className="transition-shadow hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
              <s.icon className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Completed by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={colors[i % colors.length]} />
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
