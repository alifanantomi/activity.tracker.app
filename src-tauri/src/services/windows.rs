use crate::{models::window_info::WindowInfo};
use windows::Win32::UI::WindowsAndMessaging::{
  GetForegroundWindow, GetWindowTextW, GetWindowThreadProcessId
};
use sysinfo::{System, SystemExt, ProcessExt};

pub fn get_active_window_info() -> Option<WindowInfo> {
  unsafe { 
    let hwnd = GetForegroundWindow();
    let mut title: [u16; 512] = [0; 512];
    let len = GetWindowTextW(hwnd, &mut title);

    if hwnd.0 == 0 {
      return None;
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