import { useEffect, useState } from "react";
import { MostUsed } from "./components/card/most-used-card"
import { WindowTracker } from "./components/card/window-tracker-card"
import { ActivityChartBar } from "./components/chart/activity-chart-bar"
import { invoke } from "@tauri-apps/api/tauri";

export type ChartRow = {
  hour: string
  utilities: number
  entertainment: number
  productivity: number
}

export type AppSession = {
  id: string;
  exe_name: string;
  category: string;
  start_time: string;
  end_time?: string;
  total_seconds: number;
  date: string;
};

export type WindowInfo = {
  title: string;
  exe_name: string;
  process_id: number;
};

function App() {
  const [activeSessions, setActiveSessions] = useState<AppSession[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_listWindow, setListWindow] = useState<WindowInfo[]>([]);
  const [chartData, setChartData] = useState<ChartRow[]>([]);
  const [totalTime, setTotalTime] = useState("");
  const [loading, setLoading] = useState(true);
  const [date] = useState<string>('today')
  
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

  async function fetchActiveSessions() {
    try {
      const sessions = await invoke<AppSession[]>("get_active_sessions");
      setActiveSessions(sessions);
      
      // Calculate total active time
      // const total = sessions.reduce((sum, session) => sum + session.total_seconds, 0);
      // setTotalActiveTime(total);
    } catch (err) {
      console.error("fetch active sessions error", err);
    }
  }

  async function fetchListWindows() {
    try {
      const windows = await invoke<WindowInfo[]>("get_active_window");
      setListWindow(windows);
      console.log({windows}); // This should now show data
    } catch (err) {
      console.error("fetch list window error", err);
    }
  }


  useEffect(() => {
    loadChartData();
    fetchListWindows()
  }, [date]);

  return (
    <main className="w-full md:w-3xl p-4 md:p-6 md:mx-auto">
      <div className="grid gap-4">
        <WindowTracker 
          activeSessions={activeSessions}
          fetchActiveSessions={fetchActiveSessions} 
          loadChartData={loadChartData} 
        />
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
