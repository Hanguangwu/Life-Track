use mongodb::{Client, Collection, Database, options::ClientOptions};
use crate::models::{Todo, Idea};
use std::sync::Arc;
use tokio::sync::Mutex;
use dotenv::dotenv;
use std::env;
use std::time::Duration;

/**
 * 数据库连接管理器
 */
pub struct DatabaseManager {
    #[allow(dead_code)]
    pub client: Client,
    pub database: Database,
}

impl DatabaseManager {
    /**
     * 创建新的数据库连接
     */
    pub async fn new() -> Result<Self, mongodb::error::Error> {
        // 加载.env文件
        dotenv().ok();
        
        // 从环境变量中读取MongoDB URI和数据库名称
        let mongodb_uri = env::var("MONGODB_URI").unwrap_or_else(|_| "mongodb://localhost:27017".to_string());
        let db_name = env::var("MONGODB_DB_NAME").unwrap_or_else(|_| "life_track".to_string());
        
        println!("Connecting to MongoDB at: {}", mongodb_uri);
        
        // 配置MongoDB客户端选项
        let mut client_options = ClientOptions::parse(&mongodb_uri).await?;
        
        // 设置连接超时和服务器选择超时
        client_options.connect_timeout = Some(Duration::from_secs(30));
        client_options.server_selection_timeout = Some(Duration::from_secs(30));
        
        // 设置最大连接池大小
        client_options.max_pool_size = Some(10);
        
        // 创建客户端和数据库
        let client = Client::with_options(client_options)?;
        let database = client.database(&db_name);
        
        // 测试连接
        println!("Testing database connection...");
        match client.list_database_names(None, None).await {
            Ok(_) => println!("Database connection successful!"),
            Err(e) => println!("Warning: Database connection test failed: {}", e),
        }
        
        Ok(DatabaseManager {
            client,
            database,
        })
    }
    
    /**
     * 获取待办事项集合
     */
    pub fn get_todos_collection(&self) -> Collection<Todo> {
        self.database.collection::<Todo>("todos")
    }
    
    /**
     * 获取想法集合
     */
    pub fn get_ideas_collection(&self) -> Collection<Idea> {
        self.database.collection::<Idea>("ideas")
    }
}

/**
 * 全局数据库管理器类型
 */
pub type DbManager = Arc<Mutex<DatabaseManager>>;

/**
 * 初始化数据库连接
 */
pub async fn init_database() -> Result<DbManager, mongodb::error::Error> {
    let manager = DatabaseManager::new().await?;
    Ok(Arc::new(Mutex::new(manager)))
}