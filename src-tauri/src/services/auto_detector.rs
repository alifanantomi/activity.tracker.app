use std::{thread, time::Duration, collections::HashSet};
use sysinfo::{System, SystemExt, ProcessExt};
use tauri::State;
use crate::state::AppState;

pub fn start_auto_detection(state: State<AppState>) {
    let registered_apps = state.registered_apps.clone();
    let tracking_active = state.tracking_active.clone();

    thread::spawn(move || {
        let mut system = System::new_all();
        
        loop {
            // Check every 5 seconds for registered apps
            thread::sleep(Duration::from_secs(5));
            
            // Skip if already tracking
            {
                let is_tracking = tracking_active.lock().unwrap();
                if *is_tracking {
                    continue;
                }
            }

            system.refresh_processes();
            let registered = registered_apps.lock().unwrap();
            
            if registered.is_empty() {
                continue;
            }

            // Check if any registered app is running
            let mut found_registered_app = false;
            for process in system.processes().values() {
                let exe_name = process.name();
                if registered.contains(&exe_name.to_string()) {
                    found_registered_app = true;
                    println!("[AUTO] Detected registered app: {}", exe_name);
                    break;
                }
            }

            // Auto-start tracking if registered app found
            if found_registered_app {
                {
                    let mut is_tracking = tracking_active.lock().unwrap();
                    *is_tracking = true;
                }
                
                println!("[AUTO] Auto-starting tracking...");
                crate::services::process_tracker::start_process_tracking_loop(state.clone());
                break; // Exit auto-detection loop since tracking started
            }
        }
        
        println!("[DEBUG] Auto-detection stopped");
    });
}