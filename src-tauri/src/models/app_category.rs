use std::collections::HashMap;

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppCategory {
  pub name: String,
  pub category: String
}

pub fn get_default_categories() -> HashMap<String, String> {
  let mut categories = HashMap::new();
  categories.insert("Code.exe".to_string(), "productivity".to_string());
  categories.insert("Discord.exe".to_string(), "entertainment".to_string());
  categories.insert("CivilizationVI.exe".to_string(), "entertainment".to_string());
  categories.insert("javaw.exe".to_string(), "entertainment".to_string());
  categories
}
