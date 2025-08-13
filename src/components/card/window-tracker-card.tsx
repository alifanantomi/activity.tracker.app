"use client";

import { useEffect, useState, useRef } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { type AppSession } from "@/App";

const default_apps = ["Code.exe", "CivilizationVI.exe", "Discord.exe", "javaw.exe"]

export function WindowTracker({ 
  activeSessions, 
  fetchActiveSessions,
  loadChartData,
}: { 
  activeSessions: AppSession[]
  fetchActiveSessions: () => void 
  loadChartData: () => void 
}) {
  const [registeredApps] = useState<string[]>(default_apps);
  const [isTracking, setIsTracking] = useState<boolean>(false);
  // const [totalActiveTime, setTotalActiveTime] = useState<number>(0);

  const pollIntervalMs = 1000;
  const pollRef = useRef<number | null>(null);

  useEffect(() => {
    startAutoTracking();
    return () => stopAllTracking();
  }, []);

  async function startAutoTracking() {
    try {
      await invoke("start_tracking", { registeredApps });
      setIsTracking(true);
      
      if (pollRef.current == null) {
        pollRef.current = window.setInterval(() => {
          fetchActiveSessions();
        }, pollIntervalMs);
      }
    } catch (err) {
      console.error("Auto-tracking start error", err);
    }
  }

  function stopAllTracking() {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    invoke("stop_tracking").catch(console.error);
    loadChartData()
    setIsTracking(false);
  }

  function formatTime(seconds: number, isLive = false) {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (isLive) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    if (hrs > 0) return `${hrs}h ${mins}m`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardDescription>
            Current Activity
          </CardDescription>
          <CardTitle>
            <span>{registeredApps.join(", ")}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 items-center mb-4">
            <Button onClick={startAutoTracking} disabled={isTracking} size="sm">
              Start Tracking
            </Button>
            <Button onClick={stopAllTracking} disabled={!isTracking} size="sm">
              Stop Tracking
            </Button>
          </div>

          <div>
            {activeSessions.length > 0 ? (
              <div className="space-y-2">
                {activeSessions
                  .sort((a, b) => b.total_seconds - a.total_seconds)
                  .map((session) => (
                    <div key={session.id} className="flex justify-between items-center p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="font-medium">{session.exe_name}</div>
                          <Badge variant="outline" className="capitalize">{session.category}</Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono">{formatTime(session.total_seconds, true)}</div>
                        <div className="text-xs text-gray-500">
                          Started: {new Date(session.start_time).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No registered apps currently running
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}