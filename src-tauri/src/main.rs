#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod services;
mod models;
mod state;

use crate::state::AppState;
use commands::tracking::*;
use tauri::Manager;

fn main() {
  tauri::Builder::default()
    .manage(AppState::default())
    .invoke_handler(tauri::generate_handler![
      get_active_window,
      start_tracking,
      stop_tracking,
      get_tracked_totals,
      get_active_sessions,
      get_chart_data_for_date,
      get_daily_summary
    ])
    .on_window_event(|event| {
      if let tauri::WindowEvent::CloseRequested { .. } = event.event() {
        // Auto-save before closing
        println!("[DEBUG] App closing - saving active sessions...");
        if let Some(app_state) = event.window().try_state::<AppState>() {
          let mut active = app_state.tracking_active.lock().unwrap();
          *active = false;
        }
      }
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
 