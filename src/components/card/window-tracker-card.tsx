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

const default_apps = ["Code.exe"]

export function WindowTracker() {
  const [activeSessions, setActiveSessions] = useState<AppSession[]>([]);
  const [registeredApps] = useState<string[]>(default_apps);
  const [isTracking, setIsTracking] = useState<boolean>(false);
  const [totalActiveTime, setTotalActiveTime] = useState<number>(0);
  const [hasStarted, setHasStarted] = useState(false); 

  const pollIntervalMs = 1000;
  const pollRef = useRef<number | null>(null);

  type AppSession = {
    id: string;
    exe_name: string;
    category: string;
    start_time: string;
    end_time?: string;
    total_seconds: number;
    date: string;
  };

  useEffect(() => {
    // Prevent double-start in development
    if (!hasStarted) {
      setHasStarted(true);
      startAutoTracking();
    }
    
    return () => stopAllTracking();
  }, [hasStarted]);

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

  async function fetchActiveSessions() {
    try {
      const sessions = await invoke<AppSession[]>("get_active_sessions");
      setActiveSessions(sessions);
      
      // Calculate total active time
      const total = sessions.reduce((sum, session) => sum + session.total_seconds, 0);
      setTotalActiveTime(total);
    } catch (err) {
      console.error("fetch active sessions error", err);
    }
  }

  function stopAllTracking() {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    invoke("stop_tracking").catch(console.error);
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

  function getCategoryColor(category: string) {
    switch (category) {
      case 'productivity': return 'bg-green-100 text-green-800 border-green-200';
      case 'entertainment': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'utilities': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardDescription>
            Current Activity
          </CardDescription>
          <CardTitle className="w-full flex justify-between items-center">
            <span>{registeredApps.join(", ")}</span>
            <span>{formatTime(totalActiveTime, true)}</span>
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
            <h4 className="font-semibold mb-3">Currently Running Sessions</h4>
            {activeSessions.length > 0 ? (
              <div className="space-y-2">
                {activeSessions
                  .sort((a, b) => b.total_seconds - a.total_seconds)
                  .map((session) => (
                    <div key={session.id} className="flex justify-between items-center p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        <div>
                          <div className="font-medium">{session.exe_name}</div>
                          <span className={`text-xs px-2 py-1 rounded border ${getCategoryColor(session.category)}`}>
                            {session.category}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-lg">{formatTime(session.total_seconds, true)}</div>
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