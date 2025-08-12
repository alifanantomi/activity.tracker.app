import { useEffect, useState } from "react";
import { MostUsed } from "./components/card/most-used-card"
import { WindowTracker } from "./components/card/window-tracker-card"
import { ActivityChartBar } from "./components/chart/activity-chart-bar"
import { invoke } from "@tauri-apps/api/tauri";

type ChartRow = {
  hour: string
  utilities: number
  entertainment: number
  productivity: number
}

function App() {
  const [chartData, setChartData] = useState<ChartRow[]>([]);
  const [totalTime, setTotalTime] = useState("");
  const [loading, setLoading] = useState(true);
  const [date] = useState<string>('today')

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
        entertainment,
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

  return (
    <main className="w-full md:w-3xl p-4 md:p-6 md:mx-auto">
      <div className="grid gap-4">
        <WindowTracker loadChartData={loadChartData} />
        <ActivityChartBar
          chartData={chartData}
          totalTime={totalTime}
          loading={loading}
          date={date}
        />
        <MostUsed />
      </div>
    </main>
  )
}

export default App
