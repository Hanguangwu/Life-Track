use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};

/**
 * 待办事项数据模型
 */
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Todo {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<mongodb::bson::oid::ObjectId>,
    /// 待办事项标题
    pub title: String,
    /// 待办事项描述
    pub description: Option<String>,
    /// 是否完成
    pub completed: bool,
    /// 优先级 (1-5, 1为最高)
    pub priority: i32,
    /// 截止日期
    pub due_date: Option<DateTime<Utc>>,
    /// 创建时间
    pub created_at: DateTime<Utc>,
    /// 更新时间
    pub updated_at: DateTime<Utc>,
    /// 标签
    pub tags: Vec<String>,
    /// 分类
    pub category: String,
}

/**
 * 想法记录数据模型
 */
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Idea {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<mongodb::bson::oid::ObjectId>,
    /// 想法标题
    pub title: String,
    /// 想法内容
    pub content: String,
    /// 创建时间
    pub created_at: DateTime<Utc>,
    /// 更新时间
    pub updated_at: DateTime<Utc>,
    /// 标签
    pub tags: Vec<String>,
    /// 是否收藏
    pub is_favorite: bool,
    /// 分类
    pub category: String,
}

/**
 * 创建待办事项的请求数据
 */
#[derive(Debug, Deserialize)]
pub struct CreateTodoRequest {
    pub title: String,
    pub description: Option<String>,
    pub priority: Option<i32>,
    pub due_date: Option<String>,
    pub tags: Option<Vec<String>>,
    pub category: Option<String>,
}

/**
 * 更新待办事项的请求数据
 */
#[derive(Debug, Deserialize)]
pub struct UpdateTodoRequest {
    pub title: Option<String>,
    pub description: Option<String>,
    pub completed: Option<bool>,
    pub priority: Option<i32>,
    pub due_date: Option<String>,
    pub tags: Option<Vec<String>>,
    pub category: Option<String>,
}

/**
 * 创建想法的请求数据
 */
#[derive(Debug, Deserialize)]
pub struct CreateIdeaRequest {
    pub title: String,
    pub content: String,
    pub tags: Option<Vec<String>>,
    pub is_favorite: Option<bool>,
    pub category: Option<String>,
}

/**
 * 更新想法的请求数据
 */
#[derive(Debug, Deserialize)]
pub struct UpdateIdeaRequest {
    pub title: Option<String>,
    pub content: Option<String>,
    pub tags: Option<Vec<String>>,
    pub is_favorite: Option<bool>,
    pub category: Option<String>,
}