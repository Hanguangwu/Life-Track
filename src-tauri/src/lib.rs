mod models;
mod database;
mod todo_service;
mod idea_service;

use database::init_database;
use todo_service::*;
use idea_service::*;
use tauri::Manager;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            // 初始化数据库连接
            let app_handle = app.handle().clone();
            
            // 使用阻塞方式初始化数据库，确保在应用启动前数据库已经初始化完成
            tauri::async_runtime::block_on(async {
                match init_database().await {
                    Ok(db_manager) => {
                        app_handle.manage(db_manager);
                        println!("Database initialized successfully");
                    }
                    Err(e) => {
                        eprintln!("Failed to initialize database: {}", e);
                        // 可以选择在数据库初始化失败时退出应用
                        // std::process::exit(1);
                    }
                }
            });
            
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            // Todo相关命令
            create_todo,
            get_todos,
            get_todo_by_id,
            update_todo,
            delete_todo,
            toggle_todo_completion,
            // Idea相关命令
            create_idea,
            get_ideas,
            get_idea_by_id,
            update_idea,
            delete_idea,
            toggle_idea_favorite,
            search_ideas
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
