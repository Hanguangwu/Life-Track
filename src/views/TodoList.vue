<template>
  <div class="todo-list-page">
    <!-- 头部操作区 -->
    <div class="header-actions card">
      <div class="left-actions">
        <el-button type="primary" @click="showCreateDialog = true">
          <el-icon><Plus /></el-icon>
          新建任务
        </el-button>
        
        <el-radio-group v-model="currentFilter" @change="handleFilterChange">
          <el-radio-button value="all">全部 ({{ todoStore.totalCount }})</el-radio-button>
          <el-radio-button value="pending">待完成 ({{ todoStore.pendingCount }})</el-radio-button>
          <el-radio-button value="completed">已完成 ({{ todoStore.completedCount }})</el-radio-button>
        </el-radio-group>
      </div>
      
      <div class="right-actions">
        <el-select v-model="sortBy" placeholder="排序方式" style="width: 120px">
          <el-option label="创建时间" value="created_at" />
          <el-option label="优先级" value="priority" />
          <el-option label="截止时间" value="due_date" />
        </el-select>
        
        <el-button :icon="Refresh" @click="refreshData" :loading="todoStore.loading">
          刷新
        </el-button>
      </div>
    </div>

    <!-- 待办事项列表 -->
    <div class="todo-container">
      <div v-loading="todoStore.loading">
        <div v-if="sortedTodos.length === 0" class="empty-state card">
          <el-icon size="64" color="#c0c4cc"><Document /></el-icon>
          <h3>暂无待办事项</h3>
          <p>点击上方按钮创建您的第一个任务</p>
        </div>
        
        <div v-else class="todo-grid">
          <el-card 
            v-for="todo in sortedTodos" 
            :key="todo.id" 
            class="todo-card"
            :class="{ completed: todo.completed }"
            shadow="hover"
          >
            <div class="todo-header">
              <el-checkbox 
                :model-value="todo.completed" 
                @change="toggleCompletion(todo.id!)"
                size="large"
              />
              <div class="todo-title">
                <h3 :class="{ 'line-through': todo.completed }">{{ todo.title }}</h3>
                <el-tag 
                  :type="getPriorityType(todo.priority)" 
                  size="small"
                >
                  {{ getPriorityLabel(todo.priority) }}
                </el-tag>
              </div>
              <div class="todo-actions">
                <el-button 
                  type="primary" 
                  size="small" 
                  :icon="Edit" 
                  circle 
                  @click="editTodo(todo)"
                />
                <el-button 
                  type="danger" 
                  size="small" 
                  :icon="Delete" 
                  circle 
                  @click="deleteTodo(todo.id!)"
                />
              </div>
            </div>
            
            <div v-if="todo.description" class="todo-description">
              <p>{{ todo.description }}</p>
            </div>
            
            <div class="todo-meta">
              <div class="meta-left">
                <el-tag type="info" size="small">{{ todo.category }}</el-tag>
                <div v-if="todo.tags.length > 0" class="tags">
                  <el-tag 
                    v-for="tag in todo.tags" 
                    :key="tag" 
                    size="small" 
                    effect="plain"
                  >
                    {{ tag }}
                  </el-tag>
                </div>
              </div>
              
              <div class="meta-right">
                <div v-if="todo.due_date" class="due-date" :class="{ overdue: isOverdue(todo.due_date) }">
                  <el-icon><Clock /></el-icon>
                  {{ formatDate(todo.due_date) }}
                </div>
                <div class="created-date">
                  创建于 {{ formatDate(todo.created_at) }}
                </div>
              </div>
            </div>
          </el-card>
        </div>
      </div>
      </div>
    </div>

    <!-- 创建/编辑对话框 -->
    <el-dialog 
      v-model="showCreateDialog" 
      :title="editingTodo ? '编辑任务' : '创建任务'"
      width="500px"
      @close="resetForm"
    >
      <el-form 
        ref="formRef" 
        :model="todoForm" 
        :rules="formRules" 
        label-width="80px"
      >
        <el-form-item label="标题" prop="title">
          <el-input v-model="todoForm.title" placeholder="请输入任务标题" />
        </el-form-item>
        
        <el-form-item label="描述">
          <el-input 
            v-model="todoForm.description" 
            type="textarea" 
            :rows="3" 
            placeholder="请输入任务描述（可选）"
          />
        </el-form-item>
        
        <el-form-item label="优先级">
          <el-select v-model="todoForm.priority" placeholder="选择优先级">
            <el-option 
              v-for="option in PRIORITY_OPTIONS" 
              :key="option.value" 
              :label="option.label" 
              :value="option.value"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="分类">
          <el-select v-model="todoForm.category" placeholder="选择分类" allow-create filterable>
            <el-option 
              v-for="category in CATEGORY_OPTIONS" 
              :key="category" 
              :label="category" 
              :value="category"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="截止时间">
          <el-date-picker 
            v-model="todoForm.due_date" 
            type="datetime" 
            placeholder="选择截止时间（可选）"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DDTHH:mm:ss.SSSZ"
          />
        </el-form-item>
        
        <el-form-item label="标签">
          <el-select 
            v-model="todoForm.tags" 
            multiple 
            filterable 
            allow-create 
            placeholder="添加标签（可选）"
          >
            <el-option 
              v-for="tag in allTags" 
              :key="tag" 
              :label="tag" 
              :value="tag"
            />
          </el-select>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="todoStore.loading">
          {{ editingTodo ? '更新' : '创建' }}
        </el-button>
      </template>
    </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue';
import { useTodoStore } from '../stores/todo';
import { PRIORITY_OPTIONS, CATEGORY_OPTIONS } from '../types';
import type { Todo, CreateTodoRequest, UpdateTodoRequest } from '../types';
import dayjs from 'dayjs';
import { ElMessageBox } from 'element-plus';
import {
  Plus,
  Edit,
  Delete,
  Refresh,
  Clock,
  Document,
} from '@element-plus/icons-vue';

const todoStore = useTodoStore();

// 响应式数据
const showCreateDialog = ref(false);
const editingTodo = ref<Todo | null>(null);
const currentFilter = ref<'all' | 'pending' | 'completed'>('all');
const sortBy = ref('created_at');
const formRef = ref();

// 表单数据
const todoForm = reactive({
  title: '',
  description: '',
  priority: 3,
  category: '工作',
  due_date: null as Date | null,
  tags: [] as string[],
});

// 表单验证规则
const formRules = {
  title: [
    { required: true, message: '请输入任务标题', trigger: 'blur' },
    { min: 1, max: 100, message: '标题长度应在 1 到 100 个字符', trigger: 'blur' },
  ],
};

// 计算属性
const sortedTodos = computed(() => {
  let todos = [...todoStore.filteredTodos];
  
  // 排序
  todos.sort((a, b) => {
    switch (sortBy.value) {
      case 'priority':
        return a.priority - b.priority;
      case 'due_date':
        if (!a.due_date && !b.due_date) return 0;
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      default: // created_at
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });
  
  return todos;
});

// 获取所有标签
const allTags = computed(() => {
  const tagSet = new Set<string>();
  todoStore.todos.forEach(todo => {
    todo.tags.forEach(tag => tagSet.add(tag));
  });
  return Array.from(tagSet);
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
 * 格式化日期
 */
const formatDate = (dateString: string) => {
  return dayjs(dateString).format('YYYY-MM-DD HH:mm');
};

/**
 * 检查是否过期
 */
const isOverdue = (dueDate: string) => {
  return dayjs(dueDate).isBefore(dayjs());
};

/**
 * 处理过滤器变化
 */
const handleFilterChange = (filter: 'all' | 'pending' | 'completed') => {
  todoStore.setFilter(filter);
};

/**
 * 刷新数据
 */
const refreshData = async () => {
  await todoStore.fetchTodos();
};

/**
 * 切换完成状态
 */
const toggleCompletion = async (id: string) => {
  await todoStore.toggleCompletion(id);
};

/**
 * 编辑待办事项
 */
const editTodo = (todo: Todo) => {
  editingTodo.value = todo;
  todoForm.title = todo.title;
  todoForm.description = todo.description || '';
  todoForm.priority = todo.priority;
  todoForm.category = todo.category;
  todoForm.due_date = todo.due_date ? new Date(todo.due_date) : null;
  todoForm.tags = [...todo.tags];
  showCreateDialog.value = true;
};

/**
 * 删除待办事项
 */
const deleteTodo = async (id: string) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除这个任务吗？此操作不可恢复。',
      '确认删除',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning',
      }
    );
    
    await todoStore.deleteTodo(id);
  } catch (error) {
    // 用户取消删除
  }
};

/**
 * 重置表单
 */
const resetForm = () => {
  editingTodo.value = null;
  todoForm.title = '';
  todoForm.description = '';
  todoForm.priority = 3;
  todoForm.category = '工作';
  todoForm.due_date = null;
  todoForm.tags = [];
  formRef.value?.resetFields();
};

/**
 * 提交表单
 */
const submitForm = async () => {
  try {
    await formRef.value.validate();
    
    const formData = {
      title: todoForm.title,
      description: todoForm.description || undefined,
      priority: todoForm.priority,
      category: todoForm.category,
      due_date: todoForm.due_date ? dayjs(todoForm.due_date).toISOString() : undefined,
      tags: todoForm.tags.length > 0 ? todoForm.tags : undefined,
    };
    
    if (editingTodo.value) {
      // 更新
      await todoStore.updateTodo(editingTodo.value.id!, formData as UpdateTodoRequest);
    } else {
      // 创建
      await todoStore.createTodo(formData as CreateTodoRequest);
    }
    
    showCreateDialog.value = false;
    resetForm();
  } catch (error) {
    console.error('Form validation failed:', error);
  }
};

// 组件挂载时加载数据
onMounted(async () => {
  await todoStore.fetchTodos();
  todoStore.setFilter('all');
});
</script>

<style scoped>
.todo-list-page {
  max-width: 1200px;
  margin: 0 auto;
}

.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}

.left-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.right-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.todo-container {
  min-height: 400px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #909399;
}

.empty-state h3 {
  margin: 16px 0 8px 0;
  color: #606266;
}

.todo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 16px;
}

.todo-card {
  transition: all 0.3s ease;
  cursor: pointer;
}

.todo-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.todo-card.completed {
  opacity: 0.7;
  background-color: #f9f9f9;
}

.todo-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
}

.todo-title {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.todo-title h3 {
  margin: 0;
  font-size: 16px;
  color: #303133;
  word-break: break-word;
}

.line-through {
  text-decoration: line-through;
}

.todo-actions {
  display: flex;
  gap: 4px;
}

.todo-description {
  margin-bottom: 12px;
  padding-left: 32px;
}

.todo-description p {
  margin: 0;
  color: #606266;
  font-size: 14px;
  line-height: 1.5;
}

.todo-meta {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  padding-left: 32px;
  font-size: 12px;
}

.meta-left {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.meta-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.due-date {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #909399;
}

.due-date.overdue {
  color: #f56c6c;
  font-weight: 500;
}

.created-date {
  color: #c0c4cc;
}

@media (max-width: 768px) {
  .header-actions {
    flex-direction: column;
    align-items: stretch;
  }
  
  .left-actions,
  .right-actions {
    justify-content: center;
  }
  
  .todo-grid {
    grid-template-columns: 1fr;
  }
}
</style>