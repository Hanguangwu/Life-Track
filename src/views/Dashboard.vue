<template>
  <div class="dashboard">
    <!-- 欢迎区域 -->
    <div class="welcome-section card">
      <h1>欢迎回来！</h1>
      <p>今天是 {{ currentDate }}，让我们开始高效的一天吧！</p>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-grid">
      <el-card class="stat-card" shadow="hover">
        <div class="stat-content">
          <div class="stat-icon pending">
            <el-icon size="24"><Clock /></el-icon>
          </div>
          <div class="stat-info">
            <h3>{{ todoStore.pendingCount }}</h3>
            <p>待完成任务</p>
          </div>
        </div>
      </el-card>

      <el-card class="stat-card" shadow="hover">
        <div class="stat-content">
          <div class="stat-icon completed">
            <el-icon size="24"><Check /></el-icon>
          </div>
          <div class="stat-info">
            <h3>{{ todoStore.completedCount }}</h3>
            <p>已完成任务</p>
          </div>
        </div>
      </el-card>

      <el-card class="stat-card" shadow="hover">
        <div class="stat-content">
          <div class="stat-icon ideas">
            <el-icon size="24"><Memo /></el-icon>
          </div>
          <div class="stat-info">
            <h3>{{ ideaStore.totalCount }}</h3>
            <p>想法记录</p>
          </div>
        </div>
      </el-card>

      <el-card class="stat-card" shadow="hover">
        <div class="stat-content">
          <div class="stat-icon favorites">
            <el-icon size="24"><Star /></el-icon>
          </div>
          <div class="stat-info">
            <h3>{{ ideaStore.favoriteCount }}</h3>
            <p>收藏想法</p>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 内容区域 -->
    <div class="content-grid">
      <!-- 最近的待办事项 -->
      <el-card class="recent-todos" shadow="hover">
        <template #header>
          <div class="card-header">
            <h3>最近的待办事项</h3>
            <el-button type="primary" size="small" @click="$router.push('/todos')">
              查看全部
            </el-button>
          </div>
        </template>
        
        <div v-if="recentTodos.length === 0" class="empty-state">
          <el-icon size="48" color="#c0c4cc"><Document /></el-icon>
          <p>暂无待办事项</p>
          <el-button type="primary" @click="$router.push('/todos')">
            创建第一个任务
          </el-button>
        </div>
        
        <div v-else class="todo-list">
          <div 
            v-for="todo in recentTodos" 
            :key="todo.id" 
            class="todo-item"
            :class="{ completed: todo.completed }"
          >
            <el-checkbox 
              :model-value="todo.completed" 
              @change="toggleTodo(todo.id!)"
            />
            <div class="todo-content">
              <h4>{{ todo.title }}</h4>
              <p v-if="todo.description">{{ todo.description }}</p>
              <div class="todo-meta">
                <el-tag 
                  :type="getPriorityType(todo.priority)" 
                  size="small"
                >
                  {{ getPriorityLabel(todo.priority) }}
                </el-tag>
                <span class="category">{{ todo.category }}</span>
                <span v-if="todo.due_date" class="due-date">
                  截止: {{ formatDate(todo.due_date) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </el-card>

      <!-- 最近的想法 -->
      <el-card class="recent-ideas" shadow="hover">
        <template #header>
          <div class="card-header">
            <h3>最近的想法</h3>
            <el-button type="primary" size="small" @click="$router.push('/ideas')">
              查看全部
            </el-button>
          </div>
        </template>
        
        <div v-if="recentIdeas.length === 0" class="empty-state">
          <el-icon size="48" color="#c0c4cc"><Memo /></el-icon>
          <p>暂无想法记录</p>
          <el-button type="primary" @click="$router.push('/ideas')">
            记录第一个想法
          </el-button>
        </div>
        
        <div v-else class="idea-list">
          <div 
            v-for="idea in recentIdeas" 
            :key="idea.id" 
            class="idea-item"
          >
            <div class="idea-header">
              <h4>{{ idea.title }}</h4>
              <el-icon 
                v-if="idea.is_favorite" 
                color="#f56c6c"
                @click="toggleIdeaFavorite(idea.id!)"
              >
                <Star />
              </el-icon>
            </div>
            <p class="idea-content">{{ truncateText(idea.content, 100) }}</p>
            <div class="idea-meta">
              <div class="tags">
                <el-tag 
                  v-for="tag in idea.tags" 
                  :key="tag" 
                  size="small" 
                  type="info"
                >
                  {{ tag }}
                </el-tag>
              </div>
              <span class="created-date">
                {{ formatDate(idea.created_at) }}
              </span>
            </div>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useTodoStore } from '../stores/todo';
import { useIdeaStore } from '../stores/idea';
import { PRIORITY_OPTIONS } from '../types';
import dayjs from 'dayjs';
import {
  Clock,
  Check,
  Star,
  Document,
  Memo
} from '@element-plus/icons-vue';

const todoStore = useTodoStore();
const ideaStore = useIdeaStore();

// 当前日期
const currentDate = computed(() => {
  return dayjs().format('YYYY年MM月DD日 dddd');
});

// 最近的待办事项（最多5个）
const recentTodos = computed(() => {
  return todoStore.todos
    .filter(todo => !todo.completed)
    .slice(0, 5);
});

// 最近的想法（最多5个）
const recentIdeas = computed(() => {
  return ideaStore.ideas.slice(0, 5);
});

/**
 * 获取优先级类型
 */
const getPriorityType = (priority: number) => {
  // 根据优先级返回对应的类型
  if (priority <= 2) return 'danger';
  if (priority === 3) return 'warning';
  return 'success';
};

/**
 * 获取优先级标签
 */
const getPriorityLabel = (priority: number) => {
  const option = PRIORITY_OPTIONS.find(opt => opt.value === priority);
  return option?.label || '中';
};

/**
 * 格式化日期
 */
const formatDate = (dateString: string) => {
  return dayjs(dateString).format('MM-DD HH:mm');
};

/**
 * 截断文本
 */
const truncateText = (text: string, maxLength: number) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * 切换待办事项完成状态
 */
const toggleTodo = async (id: string) => {
  try {
    await todoStore.toggleCompletion(id);
  } catch (error) {
    console.error('Failed to toggle todo:', error);
  }
};

/**
 * 切换想法收藏状态
 */
const toggleIdeaFavorite = async (id: string) => {
  try {
    await ideaStore.toggleFavorite(id);
  } catch (error) {
    console.error('Failed to toggle idea favorite:', error);
  }
};

/**
 * 组件挂载时加载数据
 */
onMounted(async () => {
  try {
    await Promise.all([
      todoStore.fetchTodos(),
      ideaStore.loadIdeas(),
    ]);
  } catch (error) {
    console.error('Failed to load dashboard data:', error);
  }
});
</script>

<style scoped>
.dashboard {
  max-width: 1200px;
  margin: 0 auto;
}

.welcome-section {
  text-align: center;
  margin-bottom: 24px;
}

.welcome-section h1 {
  font-size: 28px;
  color: #303133;
  margin-bottom: 8px;
}

.welcome-section p {
  font-size: 16px;
  color: #606266;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  cursor: pointer;
  transition: transform 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.stat-icon.pending {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-icon.completed {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stat-icon.ideas {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.stat-icon.favorites {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
}

.stat-info h3 {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.stat-info p {
  font-size: 14px;
  color: #909399;
  margin: 4px 0 0 0;
}

.content-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

@media (max-width: 768px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  color: #303133;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #909399;
}

.empty-state p {
  margin: 16px 0;
  font-size: 16px;
}

.todo-list,
.idea-list {
  max-height: 400px;
  overflow-y: auto;
}

.todo-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.todo-item:last-child {
  border-bottom: none;
}

.todo-item.completed {
  opacity: 0.6;
}

.todo-item.completed .todo-content h4 {
  text-decoration: line-through;
}

.todo-content {
  flex: 1;
}

.todo-content h4 {
  margin: 0 0 4px 0;
  font-size: 14px;
  color: #303133;
}

.todo-content p {
  margin: 0 0 8px 0;
  font-size: 12px;
  color: #606266;
}

.todo-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.category,
.due-date {
  font-size: 12px;
  color: #909399;
}

.idea-item {
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.idea-item:last-child {
  border-bottom: none;
}

.idea-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.idea-header h4 {
  margin: 0;
  font-size: 14px;
  color: #303133;
}

.idea-header .el-icon {
  cursor: pointer;
  transition: transform 0.2s ease;
}

.idea-header .el-icon:hover {
  transform: scale(1.1);
}

.idea-content {
  font-size: 12px;
  color: #606266;
  line-height: 1.5;
  margin-bottom: 8px;
}

.idea-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.created-date {
  font-size: 12px;
  color: #909399;
}
</style>