use std::{fs, path::PathBuf, io::Write};
use serde_json;
use crate::models::app_session::AppSession;
use tauri::api::path::app_data_dir;

pub fn get_data_dir() -> Result<PathBuf, Box<dyn std::error::Error>> {
    let config = tauri::Config::default();
    let app_data = app_data_dir(&config)
        .ok_or("Failed to get app data directory")?;
    
    let data_dir = app_data.join("activity_tracker");
    fs::create_dir_all(&data_dir)?;
    Ok(data_dir)
}

pub fn save_session(session: &AppSession) -> Result<(), Box<dyn std::error::Error>> {
    let data_dir = get_data_dir()?;
    let file_path = data_dir.join(format!("sessions_{}.jsonl", session.date));
    
    let mut file = fs::OpenOptions::new()
        .create(true)
        .append(true)
        .open(file_path)?;
    
    let json = serde_json::to_string(session)?;
    writeln!(file, "{}", json)?;
    
    println!("[DEBUG] Saved session: {} - {}s", session.exe_name, session.total_seconds);
    Ok(())
}

pub fn load_sessions_for_date(date: &str) -> Result<Vec<AppSession>, Box<dyn std::error::Error>> {
    let data_dir = get_data_dir()?;
    let file_path = data_dir.join(format!("sessions_{}.jsonl", date));
    
    if !file_path.exists() {
        return Ok(Vec::new());
    }
    
    let content = fs::read_to_string(file_path)?;
    let mut sessions = Vec::new();
    
    for line in content.lines() {
        if !line.trim().is_empty() {
            let session: AppSession = serde_json::from_str(line)?;
            sessions.push(session);
        }
    }
    
    Ok(sessions)
}

pub fn get_hourly_data_for_date(date: &str) -> Result<Vec<(String, u64, u64, u64)>, Box<dyn std::error::Error>> {
    let sessions = load_sessions_for_date(date)?;
    let mut hourly_data = vec![(String::new(), 0u64, 0u64, 0u64); 24];
    
    // Initialize hours
    for i in 0..24 {
        hourly_data[i].0 = format!("{:02}", i);
    }
    
    for session in sessions {
        // Distribute session time across hours (simplified - you might want more sophisticated logic)
        if let Some(start) = session.start_time.format("%H").to_string().parse::<usize>().ok() {
            if start < 24 {
                match session.category.as_str() {
                    "productivity" => hourly_data[start].3 += session.total_seconds / 60, // Convert to minutes
                    "entertainment" => hourly_data[start].2 += session.total_seconds / 60,
                    _ => hourly_data[start].1 += session.total_seconds / 60, // utilities
                }
            }
        }
    }
    
    Ok(hourly_data)
}