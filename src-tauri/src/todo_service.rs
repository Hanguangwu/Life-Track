use crate::models::{Todo, CreateTodoRequest, UpdateTodoRequest};
use crate::database::DbManager;
use mongodb::bson::{doc, oid::ObjectId};
use mongodb::options::FindOptions;
use chrono::Utc;

/**
 * 创建新的待办事项
 */
#[tauri::command]
pub async fn create_todo(
    db: tauri::State<'_, DbManager>,
    request: CreateTodoRequest,
) -> Result<String, String> {
    let db_manager = db.lock().await;
    let collection = db_manager.get_todos_collection();
    
    let due_date = if let Some(date_str) = request.due_date {
        match chrono::DateTime::parse_from_rfc3339(&date_str) {
            Ok(dt) => Some(dt.with_timezone(&Utc)),
            Err(_) => return Err("Invalid date format".to_string()),
        }
    } else {
        None
    };
    
    let todo = Todo {
        id: None,
        title: request.title,
        description: request.description,
        completed: false,
        priority: request.priority.unwrap_or(3),
        due_date,
        created_at: Utc::now(),
        updated_at: Utc::now(),
        tags: request.tags.unwrap_or_default(),
        category: request.category.unwrap_or_else(|| "默认".to_string()),
    };
    
    match collection.insert_one(todo, None).await {
        Ok(result) => {
            let id = result.inserted_id.as_object_id().unwrap().to_hex();
            Ok(id)
        }
        Err(e) => Err(format!("Failed to create todo: {}", e)),
    }
}

/**
 * 获取所有待办事项
 */
#[tauri::command]
pub async fn get_todos(
    db: tauri::State<'_, DbManager>,
    completed: Option<bool>,
) -> Result<Vec<Todo>, String> {
    let db_manager = db.lock().await;
    let collection = db_manager.get_todos_collection();
    
    let filter = if let Some(completed_status) = completed {
        doc! { "completed": completed_status }
    } else {
        doc! {}
    };
    
    let find_options = FindOptions::builder()
        .sort(doc! { "created_at": -1 })
        .build();
    
    match collection.find(filter, find_options).await {
        Ok(mut cursor) => {
            let mut todos = Vec::new();
            while cursor.advance().await.unwrap_or(false) {
                if let Ok(todo) = cursor.deserialize_current() {
                    todos.push(todo);
                }
            }
            Ok(todos)
        }
        Err(e) => Err(format!("Failed to get todos: {}", e)),
    }
}

/**
 * 根据ID获取待办事项
 */
#[tauri::command]
pub async fn get_todo_by_id(
    db: tauri::State<'_, DbManager>,
    id: String,
) -> Result<Option<Todo>, String> {
    let db_manager = db.lock().await;
    let collection = db_manager.get_todos_collection();
    
    let object_id = match ObjectId::parse_str(&id) {
        Ok(oid) => oid,
        Err(_) => return Err("Invalid ID format".to_string()),
    };
    
    match collection.find_one(doc! { "_id": object_id }, None).await {
        Ok(todo) => Ok(todo),
        Err(e) => Err(format!("Failed to get todo: {}", e)),
    }
}

/**
 * 更新待办事项
 */
#[tauri::command]
pub async fn update_todo(
    db: tauri::State<'_, DbManager>,
    id: String,
    request: UpdateTodoRequest,
) -> Result<bool, String> {
    let db_manager = db.lock().await;
    let collection = db_manager.get_todos_collection();
    
    let object_id = match ObjectId::parse_str(&id) {
        Ok(oid) => oid,
        Err(_) => return Err("Invalid ID format".to_string()),
    };
    
    let mut update_doc = doc! { "updated_at": Utc::now().to_rfc3339() };
    
    if let Some(title) = request.title {
        update_doc.insert("title", title);
    }
    if let Some(description) = request.description {
        update_doc.insert("description", description);
    }
    if let Some(completed) = request.completed {
        update_doc.insert("completed", completed);
    }
    if let Some(priority) = request.priority {
        update_doc.insert("priority", priority);
    }
    if let Some(due_date_str) = request.due_date {
        match chrono::DateTime::parse_from_rfc3339(&due_date_str) {
            Ok(dt) => {
                update_doc.insert("due_date", dt.with_timezone(&Utc).to_rfc3339());
            }
            Err(_) => return Err("Invalid date format".to_string()),
        }
    }
    if let Some(tags) = request.tags {
        update_doc.insert("tags", tags);
    }
    if let Some(category) = request.category {
        update_doc.insert("category", category);
    }
    
    match collection
        .update_one(doc! { "_id": object_id }, doc! { "$set": update_doc }, None)
        .await
    {
        Ok(result) => Ok(result.modified_count > 0),
        Err(e) => Err(format!("Failed to update todo: {}", e)),
    }
}

/**
 * 删除待办事项
 */
#[tauri::command]
pub async fn delete_todo(
    db: tauri::State<'_, DbManager>,
    id: String,
) -> Result<bool, String> {
    let db_manager = db.lock().await;
    let collection = db_manager.get_todos_collection();
    
    let object_id = match ObjectId::parse_str(&id) {
        Ok(oid) => oid,
        Err(_) => return Err("Invalid ID format".to_string()),
    };
    
    match collection.delete_one(doc! { "_id": object_id }, None).await {
        Ok(result) => Ok(result.deleted_count > 0),
        Err(e) => Err(format!("Failed to delete todo: {}", e)),
    }
}

/**
 * 切换待办事项完成状态
 */
#[tauri::command]
pub async fn toggle_todo_completion(
    db: tauri::State<'_, DbManager>,
    id: String,
) -> Result<bool, String> {
    let db_manager = db.lock().await;
    let collection = db_manager.get_todos_collection();
    
    let object_id = match ObjectId::parse_str(&id) {
        Ok(oid) => oid,
        Err(_) => return Err("Invalid ID format".to_string()),
    };
    
    // 先获取当前状态
    let current_todo = match collection.find_one(doc! { "_id": object_id }, None).await {
        Ok(Some(todo)) => todo,
        Ok(None) => return Err("Todo not found".to_string()),
        Err(e) => return Err(format!("Failed to get todo: {}", e)),
    };
    
    let new_completed = !current_todo.completed;
    
    match collection
        .update_one(
            doc! { "_id": object_id },
            doc! { "$set": { "completed": new_completed, "updated_at": Utc::now().to_rfc3339() } },
            None,
        )
        .await
    {
        Ok(result) => Ok(result.modified_count > 0),
        Err(e) => Err(format!("Failed to toggle todo completion: {}", e)),
    }
}