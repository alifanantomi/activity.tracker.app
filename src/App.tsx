import { MostUsed } from "./components/card/most-used-card"
import { WindowTracker } from "./components/card/window-tracker-card"
import { ActivityChartBar } from "./components/chart/activity-chart-bar"

function App() {
  return (
    <main className="w-full md:w-3xl p-4 md:p-6 md:mx-auto">
      <div className="grid gap-4">
        <WindowTracker />
        <ActivityChartBar />
        <MostUsed />
      </div>
    </main>
  )
}

export default App
