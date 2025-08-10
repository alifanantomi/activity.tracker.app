"use client"

import { invoke } from "@tauri-apps/api/tauri";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { useEffect, useState } from "react"

export const description = "A stacked bar chart with a legend"

const chartConfig = {
  utilities: {
    label: "Utilities",
    color: "var(--chart-1)",
  },
  entertaintment: {
    label: "Entertainment",
    color: "var(--chart-2)",
  },
  productivity: {
    label: "Productivity & Finance",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig

// Updated ActivityChartBar to use real data
export function ActivityChartBar({ date = "today" }: { date?: string }) {
  const [chartData, setChartData] = useState<any[]>([]);
  const [totalTime, setTotalTime] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChartData();
  }, [date]);

  async function loadChartData() {
    try {
      setLoading(true);
      const dateStr = date === "today" ? new Date().toISOString().split('T')[0] : date;
      
      const hourlyData = await invoke<[string, number, number, number][]>("get_chart_data_for_date", { date: dateStr });
      
      const formattedData = hourlyData.map(([hour, utilities, entertainment, productivity]) => ({
        hour,
        utilities,
        entertainment: entertainment,
        productivity
      }));
      
      setChartData(formattedData);
      
      // Calculate total time
      const total = hourlyData.reduce((sum, [, u, e, p]) => sum + u + e + p, 0);
      const hours = Math.floor(total / 60);
      const minutes = total % 60;
      setTotalTime(`${hours}h ${minutes}m`);
      
    } catch (err) {
      console.error("Failed to load chart data:", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <Card><CardContent className="p-8 text-center">Loading...</CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader>
        <CardDescription>
          {date === "today" ? "Today" : new Date(date).toLocaleDateString()}
        </CardDescription>
        <CardTitle>{totalTime}</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="hour"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar
              dataKey="utilities"
              stackId="a"
              fill="var(--color-utilities)"
              radius={[0, 0, 4, 4]}
            />
            <Bar
              dataKey="entertainment"
              stackId="a"
              fill="var(--color-entertainment)"
              radius={[0, 0, 0, 0]}
            />
            <Bar
              dataKey="productivity"
              stackId="a"
              fill="var(--color-productivity)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}