use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppSession {
  pub id: String,
  pub exe_name: String,
  pub category: String,
  pub start_time: DateTime<Utc>,
  pub end_time: Option<DateTime<Utc>>,
  pub total_seconds: u64,
  pub date: String,
}