use std::sync::{Arc, Mutex};
use std::collections::HashMap;

use crate::models::app_category::get_default_categories;
use crate::models::app_session::AppSession;

pub struct AppState {
  pub active_sessions: Arc<Mutex<HashMap<String, AppSession>>>,
  pub app_categories: Arc<Mutex<HashMap<String, String>>>,
  pub tracked_apps: Arc<Mutex<HashMap<String, u64>>>,
  pub tracking_active: Arc<Mutex<bool>>,
  pub registered_apps: Arc<Mutex<Vec<String>>>,
  pub tracking_thread_running: Arc<Mutex<bool>>,
}

impl Default for AppState {
  fn default() -> Self {
    Self {
      active_sessions: Arc::new(Mutex::new(HashMap::new())),
      app_categories: Arc::new(Mutex::new(get_default_categories())),
      tracked_apps: Arc::new(Mutex::new(HashMap::new())),
      tracking_active: Arc::new(Mutex::new(false)),
      registered_apps: Arc::new(Mutex::new(Vec::new())),
      tracking_thread_running: Arc::new(Mutex::new(false)),
    }
  }
}