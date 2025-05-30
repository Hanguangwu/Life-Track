<template>
  <div class="calendar-page">
    <!-- 头部操作区 -->
    <div class="header-actions card">
      <div class="left-actions">
        <h2>日历视图</h2>
        <el-radio-group v-model="viewMode" @change="handleViewModeChange">
          <el-radio-button value="month">月视图</el-radio-button>
          <el-radio-button value="week">周视图</el-radio-button>
        </el-radio-group>
      </div>
      
      <div class="right-actions">
        <el-button @click="goToToday">今天</el-button>
        <el-button-group>
          <el-button :icon="ArrowLeft" @click="previousPeriod" />
          <el-button :icon="ArrowRight" @click="nextPeriod" />
        </el-button-group>
        <el-button :icon="Refresh" @click="refreshData" :loading="todoStore.loading">
          刷新
        </el-button>
      </div>
    </div>

    <!-- 当前日期显示 -->
    <div class="current-period card">
      <h3>{{ currentPeriodText }}</h3>
      <div class="period-stats">
        <el-tag type="warning">待完成: {{ pendingTodosInPeriod.length }}</el-tag>
        <el-tag type="success">已完成: {{ completedTodosInPeriod.length }}</el-tag>
      </div>
    </div>

    <!-- 日历主体 -->
    <div class="calendar-container card">
      <div v-loading="todoStore.loading">
        <!-- 月视图 -->
        <div v-if="viewMode === 'month'" class="month-view">
          <!-- 星期标题 -->
          <div class="weekdays">
            <div v-for="day in weekdays" :key="day" class="weekday">
              {{ day }}
            </div>
          </div>
          
          <!-- 日期网格 -->
          <div class="days-grid">
            <div 
              v-for="day in monthDays" 
              :key="day.date" 
              class="day-cell"
              :class="{
                'other-month': !day.isCurrentMonth,
                'today': day.isToday,
                'selected': day.date === selectedDate
              }"
              @click="selectDate(day.date)"
            >
              <div class="day-number">{{ day.dayNumber }}</div>
              <div class="day-todos">
                <div 
                  v-for="todo in day.todos.slice(0, 3)" 
                  :key="todo.id" 
                  class="todo-item"
                  :class="{ completed: todo.completed }"
                  @click.stop="viewTodo(todo)"
                >
                  <div class="todo-title">{{ todo.title }}</div>
                  <div class="todo-priority" :class="`priority-${todo.priority}`"></div>
                </div>
                <div v-if="day.todos.length > 3" class="more-todos">
                  +{{ day.todos.length - 3 }} 更多
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 周视图 -->
        <div v-else class="week-view">
          <div class="week-header">
            <div v-for="day in weekDays" :key="day.date" class="week-day-header">
              <div class="day-name">{{ day.dayName }}</div>
              <div class="day-date" :class="{ today: day.isToday }">{{ day.dayNumber }}</div>
            </div>
          </div>
          
          <div class="week-content">
            <div v-for="day in weekDays" :key="day.date" class="week-day-column">
              <div class="day-todos-list">
                <div 
                  v-for="todo in day.todos" 
                  :key="todo.id" 
                  class="week-todo-item"
                  :class="{ completed: todo.completed }"
                  @click="viewTodo(todo)"
                >
                  <div class="todo-content">
                    <div class="todo-title">{{ todo.title }}</div>
                    <div class="todo-time" v-if="todo.due_date">
                      {{ formatTime(todo.due_date) }}
                    </div>
                  </div>
                  <div class="todo-priority" :class="`priority-${todo.priority}`"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 选中日期的详情 -->
    <div v-if="selectedDateTodos.length > 0" class="selected-date-details card">
      <h3>{{ formatSelectedDate }} 的任务</h3>
      <div class="todos-list">
        <el-card 
          v-for="todo in selectedDateTodos" 
          :key="todo.id" 
          class="todo-detail-card"
          :class="{ completed: todo.completed }"
          shadow="hover"
        >
          <div class="todo-detail-header">
            <el-checkbox 
              :model-value="todo.completed" 
              @change="toggleCompletion(todo.id!)"
            />
            <div class="todo-detail-title">
              <h4 :class="{ 'line-through': todo.completed }">{{ todo.title }}</h4>
              <el-tag 
                :type="getPriorityType(todo.priority)" 
                size="small"
              >
                {{ getPriorityLabel(todo.priority) }}
              </el-tag>
            </div>
            <div class="todo-detail-actions">
              <el-button 
                type="primary" 
                size="small" 
                :icon="Edit" 
                circle 
                @click="editTodo(todo)"
              />
            </div>
          </div>
          
          <div v-if="todo.description" class="todo-detail-description">
            <p>{{ todo.description }}</p>
          </div>
          
          <div class="todo-detail-meta">
            <el-tag type="info" size="small">{{ todo.category }}</el-tag>
            <div v-if="todo.due_date" class="due-time">
              <el-icon><Clock /></el-icon>
              {{ formatDateTime(todo.due_date) }}
            </div>
          </div>
        </el-card>
      </div>
    </div>

    <!-- 待办事项详情对话框 -->
    <el-dialog 
      v-model="showTodoDialog" 
      title="任务详情"
      width="500px"
    >
      <div v-if="selectedTodo" class="todo-dialog-content">
        <div class="todo-dialog-header">
          <h3>{{ selectedTodo.title }}</h3>
          <el-tag 
            :type="getPriorityType(selectedTodo.priority)" 
            size="small"
          >
            {{ getPriorityLabel(selectedTodo.priority) }}
          </el-tag>
        </div>
        
        <div v-if="selectedTodo.description" class="todo-dialog-description">
          <p>{{ selectedTodo.description }}</p>
        </div>
        
        <div class="todo-dialog-meta">
          <div class="meta-item">
            <strong>分类：</strong>{{ selectedTodo.category }}
          </div>
          <div v-if="selectedTodo.due_date" class="meta-item">
            <strong>截止时间：</strong>{{ formatDateTime(selectedTodo.due_date) }}
          </div>
          <div class="meta-item">
            <strong>状态：</strong>
            <el-tag :type="selectedTodo.completed ? 'success' : 'warning'" size="small">
              {{ selectedTodo.completed ? '已完成' : '待完成' }}
            </el-tag>
          </div>
          <div v-if="selectedTodo.tags.length > 0" class="meta-item">
            <strong>标签：</strong>
            <el-tag 
              v-for="tag in selectedTodo.tags" 
              :key="tag" 
              size="small" 
              effect="plain"
              style="margin-right: 4px;"
            >
              {{ tag }}
            </el-tag>
          </div>
        </div>
      </div>
      
      <template #footer>
        <el-button @click="showTodoDialog = false">关闭</el-button>
        <el-button 
          v-if="selectedTodo && !selectedTodo.completed"
          type="success"
          @click="markAsCompleted"
        >
          标记为完成
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useTodoStore } from '../stores/todo';
import { PRIORITY_OPTIONS } from '../types';
import type { Todo } from '../types';
import dayjs from 'dayjs';
import { ElMessage } from 'element-plus';
import {
  ArrowLeft,
  ArrowRight,
  Refresh,
  Edit,
  Clock,
} from '@element-plus/icons-vue';
import isBetween from 'dayjs/plugin/isBetween';
dayjs.extend(isBetween);

const todoStore = useTodoStore();

// 响应式数据
const viewMode = ref<'month' | 'week'>('month');
const currentDate = ref(dayjs());
const selectedDate = ref('');
const showTodoDialog = ref(false);
const selectedTodo = ref<Todo | null>(null);

// 星期标题
const weekdays = ['日', '一', '二', '三', '四', '五', '六'];

// 计算属性
/**
 * 当前时期文本
 */
const currentPeriodText = computed(() => {
  if (viewMode.value === 'month') {
    return currentDate.value.format('YYYY年MM月');
  } else {
    const startOfWeek = currentDate.value.startOf('week');
    const endOfWeek = currentDate.value.endOf('week');
    return `${startOfWeek.format('YYYY年MM月DD日')} - ${endOfWeek.format('MM月DD日')}`;
  }
});

/**
 * 当前时期内的待办事项
 */
const todosInPeriod = computed(() => {
  return todoStore.todos.filter(todo => {
    if (!todo.due_date) return false;
    
    const todoDate = dayjs(todo.due_date);
    
    if (viewMode.value === 'month') {
      return todoDate.isSame(currentDate.value, 'month');
    } else {
      const startOfWeek = currentDate.value.startOf('week');
      const endOfWeek = currentDate.value.endOf('week');
      return todoDate.isBetween(startOfWeek, endOfWeek, 'day', '[]');
    }
  });
});

/**
 * 待完成的待办事项
 */
const pendingTodosInPeriod = computed(() => {
  return todosInPeriod.value.filter(todo => !todo.completed);
});

/**
 * 已完成的待办事项
 */
const completedTodosInPeriod = computed(() => {
  return todosInPeriod.value.filter(todo => todo.completed);
});

/**
 * 月视图的日期数据
 */
const monthDays = computed(() => {
  const startOfMonth = currentDate.value.startOf('month');
  const endOfMonth = currentDate.value.endOf('month');
  const startOfCalendar = startOfMonth.startOf('week');
  const endOfCalendar = endOfMonth.endOf('week');
  
  const days = [];
  let current = startOfCalendar;
  
  while (current.isBefore(endOfCalendar) || current.isSame(endOfCalendar, 'day')) {
    const dateStr = current.format('YYYY-MM-DD');
    const todosForDay = todoStore.todos.filter(todo => {
      if (!todo.due_date) return false;
      return dayjs(todo.due_date).format('YYYY-MM-DD') === dateStr;
    });
    
    days.push({
      date: dateStr,
      dayNumber: current.date(),
      isCurrentMonth: current.isSame(currentDate.value, 'month'),
      isToday: current.isSame(dayjs(), 'day'),
      todos: todosForDay,
    });
    
    current = current.add(1, 'day');
  }
  
  return days;
});

/**
 * 周视图的日期数据
 */
const weekDays = computed(() => {
  const startOfWeek = currentDate.value.startOf('week');
  const days = [];
  
  for (let i = 0; i < 7; i++) {
    const day = startOfWeek.add(i, 'day');
    const dateStr = day.format('YYYY-MM-DD');
    const todosForDay = todoStore.todos.filter(todo => {
      if (!todo.due_date) return false;
      return dayjs(todo.due_date).format('YYYY-MM-DD') === dateStr;
    });
    
    days.push({
      date: dateStr,
      dayName: weekdays[i],
      dayNumber: day.date(),
      isToday: day.isSame(dayjs(), 'day'),
      todos: todosForDay,
    });
  }
  
  return days;
});

/**
 * 选中日期的待办事项
 */
const selectedDateTodos = computed(() => {
  if (!selectedDate.value) return [];
  
  return todoStore.todos.filter(todo => {
    if (!todo.due_date) return false;
    return dayjs(todo.due_date).format('YYYY-MM-DD') === selectedDate.value;
  });
});

/**
 * 格式化选中日期
 */
const formatSelectedDate = computed(() => {
  if (!selectedDate.value) return '';
  return dayjs(selectedDate.value).format('YYYY年MM月DD日');
});

// 方法
/**
 * 获取优先级类型
 */
const getPriorityType = (priority: number) => {
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
 * 格式化时间
 */
const formatTime = (dateString: string) => {
  return dayjs(dateString).format('HH:mm');
};

/**
 * 格式化日期时间
 */
const formatDateTime = (dateString: string) => {
  return dayjs(dateString).format('YYYY-MM-DD HH:mm');
};

/**
 * 处理视图模式变化
 */
const handleViewModeChange = () => {
  selectedDate.value = '';
};

/**
 * 跳转到今天
 */
const goToToday = () => {
  currentDate.value = dayjs();
  selectedDate.value = '';
};

/**
 * 上一个时期
 */
const previousPeriod = () => {
  if (viewMode.value === 'month') {
    currentDate.value = currentDate.value.subtract(1, 'month');
  } else {
    currentDate.value = currentDate.value.subtract(1, 'week');
  }
  selectedDate.value = '';
};

/**
 * 下一个时期
 */
const nextPeriod = () => {
  if (viewMode.value === 'month') {
    currentDate.value = currentDate.value.add(1, 'month');
  } else {
    currentDate.value = currentDate.value.add(1, 'week');
  }
  selectedDate.value = '';
};

/**
 * 刷新数据
 */
const refreshData = async () => {
  await todoStore.fetchTodos();
};

/**
 * 选择日期
 */
const selectDate = (date: string) => {
  selectedDate.value = selectedDate.value === date ? '' : date;
};

/**
 * 查看待办事项详情
 */
const viewTodo = (todo: Todo) => {
  selectedTodo.value = todo;
  showTodoDialog.value = true;
};

/**
 * 编辑待办事项
 */
const editTodo = (_todo: Todo) => {
  // 这里可以触发编辑事件或跳转到编辑页面
  ElMessage.info('编辑功能将在待办事项页面中实现');
};

/**
 * 切换完成状态
 */
const toggleCompletion = async (id: string) => {
  await todoStore.toggleCompletion(id);
};

/**
 * 标记为完成
 */
const markAsCompleted = async () => {
  if (selectedTodo.value && !selectedTodo.value.completed) {
    await todoStore.toggleCompletion(selectedTodo.value.id!);
    showTodoDialog.value = false;
  }
};

// 组件挂载时加载数据
onMounted(async () => {
  await todoStore.fetchTodos();
});
</script>

<style scoped>
.calendar-page {
  max-width: 1200px;
  margin: 0 auto;
}

.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 16px;
}

.left-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.left-actions h2 {
  margin: 0;
  color: #303133;
}

.right-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.current-period {
  margin-bottom: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.current-period h3 {
  margin: 0;
  color: #303133;
}

.period-stats {
  display: flex;
  gap: 8px;
}

.calendar-container {
  margin-bottom: 24px;
}

/* 月视图样式 */
.month-view {
  min-height: 600px;
}

.weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  border-bottom: 1px solid #ebeef5;
}

.weekday {
  padding: 12px;
  text-align: center;
  font-weight: 500;
  color: #606266;
  background-color: #f5f7fa;
}

.days-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  border: 1px solid #ebeef5;
  border-top: none;
}

.day-cell {
  min-height: 120px;
  border-right: 1px solid #ebeef5;
  border-bottom: 1px solid #ebeef5;
  padding: 8px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.day-cell:hover {
  background-color: #f5f7fa;
}

.day-cell.other-month {
  color: #c0c4cc;
  background-color: #fafafa;
}

.day-cell.today {
  background-color: #ecf5ff;
}

.day-cell.selected {
  background-color: #409eff;
  color: white;
}

.day-number {
  font-weight: 500;
  margin-bottom: 4px;
}

.day-todos {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.todo-item {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 4px;
  background-color: #409eff;
  color: white;
  border-radius: 3px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s;
}

.todo-item:hover {
  background-color: #337ecc;
}

.todo-item.completed {
  background-color: #67c23a;
  opacity: 0.7;
}

.todo-title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.todo-priority {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.priority-1,
.priority-2 {
  background-color: #f56c6c;
}

.priority-3 {
  background-color: #e6a23c;
}

.priority-4,
.priority-5 {
  background-color: #67c23a;
}

.more-todos {
  font-size: 11px;
  color: #909399;
  text-align: center;
  margin-top: 2px;
}

/* 周视图样式 */
.week-view {
  min-height: 500px;
}

.week-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  border-bottom: 2px solid #ebeef5;
}

.week-day-header {
  padding: 16px 8px;
  text-align: center;
  border-right: 1px solid #ebeef5;
}

.day-name {
  font-size: 14px;
  color: #606266;
  margin-bottom: 4px;
}

.day-date {
  font-size: 18px;
  font-weight: 500;
  color: #303133;
}

.day-date.today {
  color: #409eff;
  font-weight: 600;
}

.week-content {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  min-height: 400px;
}

.week-day-column {
  border-right: 1px solid #ebeef5;
  padding: 8px;
}

.day-todos-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.week-todo-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background-color: #f0f9ff;
  border: 1px solid #409eff;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.week-todo-item:hover {
  background-color: #ecf5ff;
  transform: translateY(-1px);
}

.week-todo-item.completed {
  background-color: #f0f9ff;
  border-color: #67c23a;
  opacity: 0.7;
}

.todo-content {
  flex: 1;
}

.todo-time {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}

/* 选中日期详情样式 */
.selected-date-details h3 {
  margin: 0 0 16px 0;
  color: #303133;
}

.todos-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.todo-detail-card {
  transition: all 0.3s ease;
}

.todo-detail-card.completed {
  opacity: 0.7;
  background-color: #f9f9f9;
}

.todo-detail-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.todo-detail-title {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
}

.todo-detail-title h4 {
  margin: 0;
  font-size: 16px;
  color: #303133;
}

.line-through {
  text-decoration: line-through;
}

.todo-detail-actions {
  display: flex;
  gap: 4px;
}

.todo-detail-description {
  margin-bottom: 12px;
  padding-left: 32px;
}

.todo-detail-description p {
  margin: 0;
  color: #606266;
  line-height: 1.5;
}

.todo-detail-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-left: 32px;
}

.due-time {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #909399;
  font-size: 14px;
}

/* 对话框样式 */
.todo-dialog-content {
  padding: 16px 0;
}

.todo-dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.todo-dialog-header h3 {
  margin: 0;
  color: #303133;
}

.todo-dialog-description {
  margin-bottom: 16px;
  padding: 12px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.todo-dialog-description p {
  margin: 0;
  color: #606266;
  line-height: 1.6;
}

.todo-dialog-meta {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #606266;
}

.meta-item strong {
  color: #303133;
  min-width: 80px;
}

@media (max-width: 768px) {
  .header-actions {
    flex-direction: column;
    align-items: stretch;
  }
  
  .current-period {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  
  .day-cell {
    min-height: 80px;
  }
  
  .week-day-header {
    padding: 12px 4px;
  }
  
  .todo-detail-meta {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }
}
</style>