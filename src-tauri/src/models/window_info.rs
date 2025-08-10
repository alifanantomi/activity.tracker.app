use serde::Serialize;

#[derive(Serialize, Clone)]
pub struct WindowInfo {
  pub title: String,
  pub exe_name: String,
  pub process_id: u32,
}