"use client"

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  type ChartConfig,
  ChartContainer
} from "@/components/ui/chart"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"

export const description = "A stacked bar chart with a legend"

type ChartRow = {
  hour: string
  utilities: number
  entertainment: number
  productivity: number
}

type CategoryValue = {
  label: string
  value: number      // raw minutes (numeric for logic)
  display: string    // formatted time string
}

const chartConfig = {
  productivity: {
    label: "Productivity",
    color: "var(--chart-1)",
  },
  entertainment: {
    label: "Entertainment",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig

export function ActivityChartBar({
  chartData,
  totalTime,
  loading,
  date
} : {
  chartData: ChartRow[],
  totalTime: string,
  loading: boolean,
  date: string
}) {
  const [categoriesValue, setCategoriesValue] = useState<CategoryValue[]>()

  const sumAndFormat = (data: ChartRow[]): CategoryValue[] | null => {
    if (!data.length) return null;

    const keys = Object.keys(data[0])
      .filter(k => k !== "hour") as (keyof Omit<ChartRow, "hour">)[]

    const result = keys.map(key => {
      const totalMinutes = data.reduce((sum, row) => sum + (row[key] || 0), 0);
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      const timeFormat = `${hours}h ${minutes}m`;

      return {
        label: key,
        value: totalMinutes, // keep numeric for comparisons
        display: timeFormat, // store formatted string separately
      };
    });

    setCategoriesValue(result);
    return result;
  }

  useEffect(() => {
    if (chartData) {
      sumAndFormat(chartData)
    }
  }, [chartData])

  const colorCategories = (val: string) => {    
    const colorMap: { label: string; value: string }[] = [
      { label: 'productivity', value: 'chart-1' },
      { label: 'entertainment', value: 'chart-2' },
    ];
    
    const match = colorMap.find(item => item.label === val);
    return match ? `text-${match.value}` : "";
  };


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
            <Bar
              dataKey="entertainment"
              stackId="a"
              fill="var(--color-entertainment)"
            />
            <Bar
              dataKey="productivity"
              stackId="a"
              fill="var(--color-productivity)"
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <div className="w-full flex gap-4 items-center">
          {categoriesValue && categoriesValue.map((item, index) => (
            item.value > 0 && (
              <div key={index} className="grid">
                <span className={cn("font-medium capitalize text-sm", colorCategories(item.label))}>
                  {item.label}
                </span>
                <span className="text-sm text-muted-foreground">{item.display}</span>
              </div>
            )
          ))}
        </div>
      </CardFooter>
    </Card>
  );
}