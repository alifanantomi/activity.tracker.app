use crate::{models::app_session::AppSession, services::storage, state::AppState};
use chrono::Utc;
use std::{collections::{HashMap, HashSet}, sync::{Arc, Mutex}, thread, time::{Duration, Instant}};
use sysinfo::{ProcessExt, System, SystemExt};
use tauri::State;
use uuid::Uuid;

pub fn start_process_tracking_loop(state: State<AppState>) {
    {
        let mut thread_running = state.tracking_thread_running.lock().unwrap();
        if *thread_running {
            println!("[DEBUG] Tracking thread already running, skipping...");
            return;
        }
        *thread_running = true;
    }

    let sessions = state.active_sessions.clone();
    let categories = state.app_categories.clone();
    let active_flag = state.tracking_active.clone();
    let registered_apps = state.registered_apps.clone();
    let thread_flag = state.tracking_thread_running.clone();

    thread::spawn(move || {
        let mut system = System::new_all();
        let mut last_tick = Instant::now();
        
        loop {
            let now = Instant::now();
            
            // Only proceed if at least 1 second has passed
            if now.duration_since(last_tick) < Duration::from_secs(1) {
                thread::sleep(Duration::from_millis(100));
                continue;
            }
            last_tick = now;
            
            // Check if tracking should stop
            {
                let tracking = active_flag.lock().unwrap();
                if !*tracking {
                    save_all_active_sessions(&sessions); // Remove .await
                    break;
                }
            }

            system.refresh_processes();
            let now_utc = Utc::now();
            let today = now_utc.format("%Y-%m-%d").to_string();

            let registered = registered_apps.lock().unwrap().clone();
            let mut running_apps = HashSet::new();

            // Find running registered processes
            for process in system.processes().values() {
                let exe_name = process.name();
                if registered.contains(&exe_name.to_string()) {
                    running_apps.insert(exe_name.to_string());
                }
                // if !exe_name.is_empty() {
                //     running_apps.insert(exe_name.to_string());
                // }
            }

            let mut sessions_guard = sessions.lock().unwrap();
            let categories_guard = categories.lock().unwrap();

            // Start new sessions for newly detected apps
            for app in &running_apps {
                if !sessions_guard.contains_key(app) {
                    let category = categories_guard.get(app).unwrap_or(&"utilities".to_string()).clone();
                    let session = AppSession {
                        id: Uuid::new_v4().to_string(),
                        exe_name: app.clone(),
                        category,
                        start_time: now_utc,
                        end_time: None,
                        total_seconds: 0,
                        date: today.clone(),
                    };
                    sessions_guard.insert(app.clone(), session);
                    println!("[DEBUG] Started tracking session for: {}", app);
                }
            }

            // Update existing sessions and end stopped ones
            let mut to_save = Vec::new();
            let mut to_remove = Vec::new();

            for (app, session) in sessions_guard.iter_mut() {
                if running_apps.contains(app) {
                    // App still running - increment time
                    session.total_seconds += 1;
                    println!("[DEBUG] {} running for {} seconds", app, session.total_seconds);
                } else {
                    // App stopped - prepare to save
                    session.end_time = Some(now_utc);
                    to_save.push(session.clone());
                    to_remove.push(app.clone());
                    println!("[DEBUG] App {} stopped after {} seconds", app, session.total_seconds);
                }
            }

            // Remove stopped sessions
            for app in to_remove {
                sessions_guard.remove(&app);
            }
            drop(sessions_guard);

            // Save completed sessions (using existing file storage for now)
            for session in to_save {
                if let Err(e) = storage::save_session(&session) {
                    eprintln!("[ERROR] Failed to save session: {}", e);
                }
            }
        }
        
        {
            let mut thread_running = thread_flag.lock().unwrap();
            *thread_running = false;
        }
        
        println!("[DEBUG] Process tracking stopped");
    });
}

fn save_all_active_sessions(sessions: &Arc<Mutex<HashMap<String, AppSession>>>) {
    let mut sessions_guard = sessions.lock().unwrap();
    let now = Utc::now();
    
    for session in sessions_guard.values_mut() {
        session.end_time = Some(now);
        if let Err(e) = storage::save_session(session) {
            eprintln!("[ERROR] Failed to save session on shutdown: {}", e);
        }
    }
    sessions_guard.clear();
    println!("[DEBUG] Saved all active sessions on shutdown");
}