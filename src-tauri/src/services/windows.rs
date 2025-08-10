use crate::{models::window_info::WindowInfo, state::AppState};
use tauri::State;
use windows::Win32::UI::WindowsAndMessaging::{
  GetForegroundWindow, GetWindowTextW, GetWindowThreadProcessId
};
use sysinfo::{System, SystemExt, ProcessExt};

pub fn get_window_list(state: State<AppState>) -> Vec<WindowInfo> {
  let registered_apps = state.registered_apps.lock().unwrap().clone();
  let mut windows = Vec::new();

  if let Some(active) = get_active_window_info() {
    if registered_apps.contains(&active.exe_name) {
      windows.push(active)
    }
  }

  windows
}

pub fn get_active_window_info() -> Option<WindowInfo> {
  unsafe { 
    let hwnd = GetForegroundWindow();
    let mut title: [u16; 512] = [0; 512];
    let len = GetWindowTextW(hwnd, &mut title);

    if len == 0 {
      return  None;
    }

    let title_str = String::from_utf16_lossy(&title[..len as usize]);

    let mut pid = 0;
    GetWindowThreadProcessId(hwnd, Some(&mut  pid));

    let mut system = System::new();
    system.refresh_processes();

    let exe_name = system
      .process((pid as usize).into())
      .map(|p| p.name().to_string())
      .unwrap_or_else(|| "Unkown".into());

    Some(WindowInfo { title: title_str, exe_name, process_id: pid })
  }
}