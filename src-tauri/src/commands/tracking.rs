use tauri::State;

use crate::{
models::{app_session::AppSession},
  services::{storage, process_tracker, windows}, 
  state::AppState
};

#[tauri::command]
pub fn get_active_window() -> Option<crate::models::window_info::WindowInfo> {
  windows::get_active_window_info()
}

#[tauri::command]
pub fn start_tracking(state: State<AppState>, registered_apps: Vec<String>) {
  println!("[DEBUG] start_tracking called with: {:?}", registered_apps);

  {
    let mut apps = state.registered_apps.lock().unwrap();
    *apps = registered_apps;
  }
  {
    let mut active = state.tracking_active.lock().unwrap();
    *active = true
  }
  
  process_tracker::start_process_tracking_loop(state);
}

#[tauri::command]
pub fn stop_tracking(state: State<AppState>) {
  let mut active = state.tracking_active.lock().unwrap();
  *active = false;
}

#[tauri::command]
pub fn get_tracked_totals(state: tauri::State<AppState>) -> Vec<(String, u64)> {
  let tracked = state.tracked_apps.lock().unwrap();
  println!("[DEBUG] Sending tracked totals: {:?}", *tracked);

  tracked.iter()
    .map(|(exe, &seconds)| (exe.clone(), seconds))
    .collect()
}

#[tauri::command]
pub fn get_active_sessions(state: State<AppState>) -> Vec<AppSession> {
  let sessions = state.active_sessions.lock().unwrap();
  sessions.values().cloned().collect()
}

#[tauri::command]
pub fn get_chart_data_for_date(date: String) -> Result<Vec<(String, u64, u64, u64)>, String> {
  storage::get_hourly_data_for_date(&date)
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_daily_summary(date: String) -> Result<Vec<AppSession>, String> {
  storage::load_sessions_for_date(&date)
    .map_err(|e| e.to_string())
}