use crate::models::{Idea, CreateIdeaRequest, UpdateIdeaRequest};
use crate::database::DbManager;
use mongodb::bson::{doc, oid::ObjectId};
use mongodb::options::FindOptions;
use chrono::Utc;

/**
 * 创建新的想法记录
 */
#[tauri::command]
pub async fn create_idea(
    db: tauri::State<'_, DbManager>,
    request: CreateIdeaRequest,
) -> Result<String, String> {
    let db_manager = db.lock().await;
    let collection = db_manager.get_ideas_collection();
    
    let idea = Idea {
        id: None,
        title: request.title,
        content: request.content,
        created_at: Utc::now(),
        updated_at: Utc::now(),
        tags: request.tags.unwrap_or_default(),
        is_favorite: request.is_favorite.unwrap_or(false),
        category: request.category.unwrap_or_else(|| "未分类".to_string()),
    };
    
    match collection.insert_one(idea, None).await {
        Ok(result) => {
            let id = result.inserted_id.as_object_id().unwrap().to_hex();
            Ok(id)
        }
        Err(e) => Err(format!("Failed to create idea: {}", e)),
    }
}

/**
 * 获取所有想法记录
 */
#[tauri::command]
pub async fn get_ideas(
    db: tauri::State<'_, DbManager>,
    is_favorite: Option<bool>,
) -> Result<Vec<Idea>, String> {
    let db_manager = db.lock().await;
    let collection = db_manager.get_ideas_collection();
    
    let filter = if let Some(favorite_status) = is_favorite {
        doc! { "is_favorite": favorite_status }
    } else {
        doc! {}
    };
    
    let find_options = FindOptions::builder()
        .sort(doc! { "created_at": -1 })
        .build();
    
    match collection.find(filter, find_options).await {
        Ok(mut cursor) => {
            let mut ideas = Vec::new();
            while cursor.advance().await.unwrap_or(false) {
                if let Ok(idea) = cursor.deserialize_current() {
                    ideas.push(idea);
                }
            }
            Ok(ideas)
        }
        Err(e) => Err(format!("Failed to get ideas: {}", e)),
    }
}

/**
 * 根据ID获取想法记录
 */
#[tauri::command]
pub async fn get_idea_by_id(
    db: tauri::State<'_, DbManager>,
    id: String,
) -> Result<Option<Idea>, String> {
    let db_manager = db.lock().await;
    let collection = db_manager.get_ideas_collection();
    
    let object_id = match ObjectId::parse_str(&id) {
        Ok(oid) => oid,
        Err(_) => return Err("Invalid ID format".to_string()),
    };
    
    match collection.find_one(doc! { "_id": object_id }, None).await {
        Ok(idea) => Ok(idea),
        Err(e) => Err(format!("Failed to get idea: {}", e)),
    }
}

/**
 * 更新想法记录
 */
#[tauri::command]
pub async fn update_idea(
    db: tauri::State<'_, DbManager>,
    id: String,
    request: UpdateIdeaRequest,
) -> Result<bool, String> {
    let db_manager = db.lock().await;
    let collection = db_manager.get_ideas_collection();
    
    let object_id = match ObjectId::parse_str(&id) {
        Ok(oid) => oid,
        Err(_) => return Err("Invalid ID format".to_string()),
    };
    
    let mut update_doc = doc! { "updated_at": Utc::now().to_rfc3339() };
    
    if let Some(title) = request.title {
        update_doc.insert("title", title);
    }
    if let Some(content) = request.content {
        update_doc.insert("content", content);
    }
    if let Some(tags) = request.tags {
        update_doc.insert("tags", tags);
    }
    if let Some(is_favorite) = request.is_favorite {
        update_doc.insert("is_favorite", is_favorite);
    }
    if let Some(category) = request.category {
        update_doc.insert("category", category);
    }
    
    match collection
        .update_one(doc! { "_id": object_id }, doc! { "$set": update_doc }, None)
        .await
    {
        Ok(result) => Ok(result.modified_count > 0),
        Err(e) => Err(format!("Failed to update idea: {}", e)),
    }
}

/**
 * 删除想法记录
 */
#[tauri::command]
pub async fn delete_idea(
    db: tauri::State<'_, DbManager>,
    id: String,
) -> Result<bool, String> {
    let db_manager = db.lock().await;
    let collection = db_manager.get_ideas_collection();
    
    let object_id = match ObjectId::parse_str(&id) {
        Ok(oid) => oid,
        Err(_) => return Err("Invalid ID format".to_string()),
    };
    
    match collection.delete_one(doc! { "_id": object_id }, None).await {
        Ok(result) => Ok(result.deleted_count > 0),
        Err(e) => Err(format!("Failed to delete idea: {}", e)),
    }
}

/**
 * 切换想法收藏状态
 */
#[tauri::command]
pub async fn toggle_idea_favorite(
    db: tauri::State<'_, DbManager>,
    id: String,
) -> Result<bool, String> {
    let db_manager = db.lock().await;
    let collection = db_manager.get_ideas_collection();
    
    let object_id = match ObjectId::parse_str(&id) {
        Ok(oid) => oid,
        Err(_) => return Err("Invalid ID format".to_string()),
    };
    
    // 先获取当前状态
    let current_idea = match collection.find_one(doc! { "_id": object_id }, None).await {
        Ok(Some(idea)) => idea,
        Ok(None) => return Err("Idea not found".to_string()),
        Err(e) => return Err(format!("Failed to get idea: {}", e)),
    };
    
    let new_favorite = !current_idea.is_favorite;
    
    match collection
        .update_one(
            doc! { "_id": object_id },
            doc! { "$set": { "is_favorite": new_favorite, "updated_at": Utc::now().to_rfc3339() } },
            None,
        )
        .await
    {
        Ok(result) => Ok(result.modified_count > 0),
        Err(e) => Err(format!("Failed to toggle idea favorite: {}", e)),
    }
}

/**
 * 搜索想法记录
 */
#[tauri::command]
pub async fn search_ideas(
    db: tauri::State<'_, DbManager>,
    keyword: String,
) -> Result<Vec<Idea>, String> {
    let db_manager = db.lock().await;
    let collection = db_manager.get_ideas_collection();
    
    let filter = doc! {
        "$or": [
            { "title": { "$regex": &keyword, "$options": "i" } },
            { "content": { "$regex": &keyword, "$options": "i" } },
            { "tags": { "$in": [&keyword] } }
        ]
    };
    
    let find_options = FindOptions::builder()
        .sort(doc! { "created_at": -1 })
        .build();
    
    match collection.find(filter, find_options).await {
        Ok(mut cursor) => {
            let mut ideas = Vec::new();
            while cursor.advance().await.unwrap_or(false) {
                if let Ok(idea) = cursor.deserialize_current() {
                    ideas.push(idea);
                }
            }
            Ok(ideas)
        }
        Err(e) => Err(format!("Failed to search ideas: {}", e)),
    }
}