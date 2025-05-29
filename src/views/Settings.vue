<template>
  <div class="settings-page">
    <div class="settings-header">
      <h2>设置</h2>
      <p>配置您的应用偏好设置</p>
    </div>

    <!-- 数据库设置 -->
    <!-- <el-card class="settings-section" shadow="hover">
      <template #header>
        <div class="section-header">
          <el-icon><Database /></el-icon>
          <span>数据库设置</span>
        </div>
      </template>
      
      <el-form label-width="120px">
        <el-form-item label="连接状态">
          <el-tag :type="dbStatus.connected ? 'success' : 'danger'">
            {{ dbStatus.connected ? '已连接' : '未连接' }}
          </el-tag>
          <el-button 
            type="primary" 
            size="small" 
            @click="testConnection" 
            :loading="dbStatus.testing"
            style="margin-left: 12px;"
          >
            测试连接
          </el-button>
        </el-form-item>
        
        <el-form-item label="数据库URL">
          <el-input 
            v-model="dbConfig.url" 
            placeholder="mongodb://localhost:27017/life_track"
            :disabled="!editMode.database"
          />
        </el-form-item>
        
        <el-form-item>
          <el-button 
            v-if="!editMode.database" 
            @click="editMode.database = true"
          >
            编辑
          </el-button>
          <template v-else>
            <el-button 
              type="primary" 
              @click="saveDbConfig" 
              :loading="saving.database"
            >
              保存
            </el-button>
            <el-button @click="cancelDbEdit">
              取消
            </el-button>
          </template>
        </el-form-item>
      </el-form>
    </el-card> -->

    <!-- 界面设置 -->
    <el-card class="settings-section" shadow="hover">
      <template #header>
        <div class="section-header">
          <el-icon><Monitor /></el-icon>
          <span>界面设置</span>
        </div>
      </template>
      
      <el-form label-width="120px">
        <el-form-item label="主题模式">
          <el-radio-group v-model="uiConfig.theme" @change="saveUiConfig">
            <el-radio label="light">浅色模式</el-radio>
            <el-radio label="dark">深色模式</el-radio>
            <el-radio label="auto">跟随系统</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="语言">
          <el-select v-model="uiConfig.language" @change="saveUiConfig">
            <el-option label="简体中文" value="zh-CN" />
            <el-option label="English" value="en-US" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="侧边栏">
          <el-switch 
            v-model="uiConfig.sidebarCollapsed" 
            @change="saveUiConfig"
            active-text="默认折叠"
            inactive-text="默认展开"
          />
        </el-form-item>
        
        <el-form-item label="动画效果">
          <el-switch 
            v-model="uiConfig.animations" 
            @change="saveUiConfig"
            active-text="开启"
            inactive-text="关闭"
          />
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 通知设置 -->
    <el-card class="settings-section" shadow="hover">
      <template #header>
        <div class="section-header">
          <el-icon><Bell /></el-icon>
          <span>通知设置</span>
        </div>
      </template>
      
      <el-form label-width="120px">
        <el-form-item label="桌面通知">
          <el-switch 
            v-model="notificationConfig.desktop" 
            @change="saveNotificationConfig"
            active-text="开启"
            inactive-text="关闭"
          />
        </el-form-item>
        
        <el-form-item label="任务提醒">
          <el-switch 
            v-model="notificationConfig.taskReminder" 
            @change="saveNotificationConfig"
            active-text="开启"
            inactive-text="关闭"
          />
        </el-form-item>
        
        <el-form-item label="提醒时间">
          <el-select 
            v-model="notificationConfig.reminderTime" 
            @change="saveNotificationConfig"
            :disabled="!notificationConfig.taskReminder"
          >
            <el-option label="5分钟前" :value="5" />
            <el-option label="15分钟前" :value="15" />
            <el-option label="30分钟前" :value="30" />
            <el-option label="1小时前" :value="60" />
            <el-option label="2小时前" :value="120" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="声音提醒">
          <el-switch 
            v-model="notificationConfig.sound" 
            @change="saveNotificationConfig"
            active-text="开启"
            inactive-text="关闭"
          />
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 数据管理 -->
    <el-card class="settings-section" shadow="hover">
      <template #header>
        <div class="section-header">
          <el-icon><FolderOpened /></el-icon>
          <span>数据管理</span>
        </div>
      </template>
      
      <el-form label-width="120px">
        <el-form-item label="数据统计">
          <div class="data-stats">
            <div class="stat-item">
              <span class="stat-label">待办事项：</span>
              <span class="stat-value">{{ dataStats.todos }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">想法记录：</span>
              <span class="stat-value">{{ dataStats.ideas }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">存储空间：</span>
              <span class="stat-value">{{ dataStats.storage }}</span>
            </div>
          </div>
        </el-form-item>
        
        <el-form-item label="数据导出">
          <el-button-group>
            <el-button @click="exportData('json')" :loading="exporting.json">
              导出为 JSON
            </el-button>
            <el-button @click="exportData('csv')" :loading="exporting.csv">
              导出为 CSV
            </el-button>
          </el-button-group>
        </el-form-item>
        
        <el-form-item label="数据导入">
          <el-upload
            ref="uploadRef"
            :auto-upload="false"
            :show-file-list="false"
            accept=".json,.csv"
            @change="handleFileSelect"
          >
            <el-button>选择文件</el-button>
          </el-upload>
          <el-button 
            v-if="selectedFile" 
            type="primary" 
            @click="importData" 
            :loading="importing"
            style="margin-left: 8px;"
          >
            导入数据
          </el-button>
        </el-form-item>
        
        <el-form-item label="清理数据">
          <el-button-group>
            <el-button 
              type="warning" 
              @click="clearCompletedTodos" 
              :loading="clearing.todos"
            >
              清理已完成任务
            </el-button>
            <el-button 
              type="danger" 
              @click="clearAllData" 
              :loading="clearing.all"
            >
              清空所有数据
            </el-button>
          </el-button-group>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 关于信息 -->
    <el-card class="settings-section" shadow="hover">
      <template #header>
        <div class="section-header">
          <el-icon><InfoFilled /></el-icon>
          <span>关于</span>
        </div>
      </template>
      
      <el-form label-width="120px">
        <el-form-item label="应用名称">
          <span>Life Track</span>
        </el-form-item>
        
        <el-form-item label="版本">
          <span>{{ appInfo.version }}</span>
        </el-form-item>
        
        <el-form-item label="技术栈">
          <div class="tech-stack">
            <el-tag size="small" style="margin-right: 8px;">Tauri</el-tag>
            <el-tag size="small" style="margin-right: 8px;">Vue 3</el-tag>
            <el-tag size="small" style="margin-right: 8px;">TypeScript</el-tag>
            <el-tag size="small" style="margin-right: 8px;">Rust</el-tag>
            <el-tag size="small" style="margin-right: 8px;">MongoDB</el-tag>
          </div>
        </el-form-item>
        
        <el-form-item label="开发者">
          <span>{{ appInfo.author }}</span>
        </el-form-item>
        
        <el-form-item label="许可证">
          <span>{{ appInfo.license }}</span>
        </el-form-item>
        
        <el-form-item label="更新检查">
          <el-button @click="checkForUpdates" :loading="checkingUpdates">
            检查更新
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useTodoStore } from '../stores/todo';
import { useIdeaStore } from '../stores/idea';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  Monitor,
  Bell,
  FolderOpened,
  InfoFilled,
} from '@element-plus/icons-vue';

const todoStore = useTodoStore();
const ideaStore = useIdeaStore();

// 响应式数据

const exporting = reactive({
  json: false,
  csv: false,
});

const clearing = reactive({
  todos: false,
  all: false,
});

const importing = ref(false);
const checkingUpdates = ref(false);
const selectedFile = ref<File | null>(null);
const uploadRef = ref();

// 数据库状态已移除

// 配置数据
// const dbConfig = reactive({
//   url: 'mongodb://localhost:27017/life_track',
// });

const uiConfig = reactive({
  theme: 'light',
  language: 'zh-CN',
  sidebarCollapsed: false,
  animations: true,
});

const notificationConfig = reactive({
  desktop: true,
  taskReminder: true,
  reminderTime: 15,
  sound: true,
});

// 数据统计
const dataStats = reactive({
  todos: 0,
  ideas: 0,
  storage: '0 MB',
});

// 应用信息
const appInfo = reactive({
  version: '1.0.0',
  author: 'Life Track Team',
  license: 'MIT',
});

// 方法

/**
 * 保存数据库配置
 */
// const saveDbConfig = async () => {
//   saving.database = true;
//   try {
//     // 这里应该调用 Tauri 命令保存配置
//     await new Promise(resolve => setTimeout(resolve, 500)); // 模拟保存
//     editMode.database = false;
//     ElMessage.success('数据库配置已保存');
//   } catch (error) {
//     ElMessage.error('保存配置失败');
//   } finally {
//     saving.database = false;
//   }
// };

/**
 * 取消数据库编辑
 */
// const cancelDbEdit = () => {
//   editMode.database = false;
//   // 重置配置
//   dbConfig.url = 'mongodb://localhost:27017/life_track';
// };

/**
 * 保存界面配置
 */
const saveUiConfig = async () => {
  try {
    // 这里应该调用 Tauri 命令保存配置
    localStorage.setItem('ui_config', JSON.stringify(uiConfig));
    ElMessage.success('界面设置已保存');
  } catch (error) {
    ElMessage.error('保存设置失败');
  }
};

/**
 * 保存通知配置
 */
const saveNotificationConfig = async () => {
  try {
    // 这里应该调用 Tauri 命令保存配置
    localStorage.setItem('notification_config', JSON.stringify(notificationConfig));
    ElMessage.success('通知设置已保存');
  } catch (error) {
    ElMessage.error('保存设置失败');
  }
};

/**
 * 导出数据
 */
const exportData = async (format: 'json' | 'csv') => {
  exporting[format] = true;
  try {
    // 获取所有数据
    const todos = todoStore.todos;
    const ideas = ideaStore.ideas;
    
    let data: string;
    let filename: string;
    let mimeType: string;
    
    if (format === 'json') {
      data = JSON.stringify({ todos, ideas }, null, 2);
      filename = `life_track_backup_${new Date().toISOString().split('T')[0]}.json`;
      mimeType = 'application/json';
    } else {
      // CSV 格式（简化版）
      const csvData = [
        'Type,Title,Content,Category,Created,Completed',
        ...todos.map(todo => `Todo,"${todo.title}","${todo.description || ''}",${todo.category},${todo.created_at},${todo.completed}`),
        ...ideas.map(idea => `Idea,"${idea.title}","${idea.content}",${idea.category},${idea.created_at},false`)
      ].join('\n');
      data = csvData;
      filename = `life_track_backup_${new Date().toISOString().split('T')[0]}.csv`;
      mimeType = 'text/csv';
    }
    
    // 创建下载链接
    const blob = new Blob([data], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    
    ElMessage.success('数据导出成功');
  } catch (error) {
    ElMessage.error('数据导出失败');
  } finally {
    exporting[format] = false;
  }
};

/**
 * 处理文件选择
 */
const handleFileSelect = (file: any) => {
  selectedFile.value = file.raw;
};

/**
 * 导入数据
 */
const importData = async () => {
  if (!selectedFile.value) return;
  
  importing.value = true;
  try {
    const text = await selectedFile.value.text();
    const data = JSON.parse(text);
    
    // 这里应该调用 Tauri 命令导入数据
    console.log('Importing data:', data);
    
    ElMessage.success('数据导入成功');
    selectedFile.value = null;
    
    // 刷新数据
    await Promise.all([
      todoStore.fetchTodos(),
      ideaStore.loadIdeas()
    ]);
  } catch (error) {
    ElMessage.error('数据导入失败，请检查文件格式');
  } finally {
    importing.value = false;
  }
};

/**
 * 清理已完成任务
 */
const clearCompletedTodos = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要删除所有已完成的任务吗？此操作不可恢复。',
      '确认清理',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    );
    
    clearing.todos = true;
    
    // 这里应该调用 Tauri 命令清理已完成任务
    await new Promise(resolve => setTimeout(resolve, 1000)); // 模拟清理
    
    ElMessage.success('已完成任务清理成功');
    await todoStore.fetchTodos();
  } catch (error) {
    // 用户取消操作
  } finally {
    clearing.todos = false;
  }
};

/**
 * 清空所有数据
 */
const clearAllData = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要清空所有数据吗？此操作不可恢复，建议先导出备份。',
      '危险操作',
      {
        confirmButtonText: '确定清空',
        cancelButtonText: '取消',
        type: 'error',
      }
    );
    
    clearing.all = true;
    
    // 这里应该调用 Tauri 命令清空所有数据
    await new Promise(resolve => setTimeout(resolve, 1500)); // 模拟清理
    
    ElMessage.success('所有数据已清空');
    await Promise.all([
      todoStore.fetchTodos(),
      ideaStore.loadIdeas()
    ]);
  } catch (error) {
    // 用户取消操作
  } finally {
    clearing.all = false;
  }
};

/**
 * 检查更新
 */
const checkForUpdates = async () => {
  checkingUpdates.value = true;
  try {
    // 这里应该调用 Tauri 命令检查更新
    await new Promise(resolve => setTimeout(resolve, 2000)); // 模拟检查
    ElMessage.info('当前已是最新版本');
  } catch (error) {
    ElMessage.error('检查更新失败');
  } finally {
    checkingUpdates.value = false;
  }
};

/**
 * 加载配置
 */
const loadConfigs = () => {
  try {
    const uiConfigStr = localStorage.getItem('ui_config');
    if (uiConfigStr) {
      Object.assign(uiConfig, JSON.parse(uiConfigStr));
    }
    
    const notificationConfigStr = localStorage.getItem('notification_config');
    if (notificationConfigStr) {
      Object.assign(notificationConfig, JSON.parse(notificationConfigStr));
    }
  } catch (error) {
    console.error('Failed to load configs:', error);
  }
};

/**
 * 更新数据统计
 */
const updateDataStats = () => {
  dataStats.todos = todoStore.todos.length;
  dataStats.ideas = ideaStore.ideas.length;
  
  // 计算存储空间（简化版）
  const totalSize = JSON.stringify({
    todos: todoStore.todos,
    ideas: ideaStore.ideas
  }).length;
  dataStats.storage = `${(totalSize / 1024 / 1024).toFixed(2)} MB`;
};

// 组件挂载时加载配置和数据
onMounted(async () => {
  loadConfigs();
  await Promise.all([
    todoStore.fetchTodos(),
    ideaStore.loadIdeas()
  ]);
  updateDataStats();
});
</script>

<style scoped>
.settings-page {
  max-width: 800px;
  margin: 0 auto;
}

.settings-header {
  margin-bottom: 24px;
}

.settings-header h2 {
  margin: 0 0 8px 0;
  color: #303133;
  font-size: 24px;
}

.settings-header p {
  margin: 0;
  color: #606266;
  font-size: 14px;
}

.settings-section {
  margin-bottom: 24px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  color: #303133;
}

.data-stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.stat-label {
  color: #606266;
  font-size: 14px;
}

.stat-value {
  color: #303133;
  font-weight: 500;
}

.tech-stack {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

:deep(.el-form-item__label) {
  color: #606266;
  font-weight: 500;
}

:deep(.el-card__header) {
  background-color: #fafafa;
  border-bottom: 1px solid #ebeef5;
}

@media (max-width: 768px) {
  .settings-page {
    padding: 0 16px;
  }
  
  .data-stats {
    gap: 4px;
  }
  
  .stat-item {
    flex-direction: column;
    align-items: stretch;
    gap: 4px;
  }
}
</style>