import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { TodoAPI } from '../api';
import { SupabaseTodoService } from '../services/supabase';
import type { Todo, CreateTodoRequest, UpdateTodoRequest } from '../types';
import { ElMessage } from 'element-plus';
import { useAuthStore } from './auth';

/**
 * 待办事项状态管理
 */
export const useTodoStore = defineStore('todo', () => {
  // 状态
  const todos = ref<Todo[]>([]);
  const loading = ref(false);
  const currentFilter = ref<'all' | 'pending' | 'completed'>('all');

  // 计算属性
  const filteredTodos = computed(() => {
    switch (currentFilter.value) {
      case 'pending':
        return todos.value.filter(todo => !todo.completed);
      case 'completed':
        return todos.value.filter(todo => todo.completed);
      default:
        return todos.value;
    }
  });

  const pendingCount = computed(() => {
    return todos.value.filter(todo => !todo.completed).length;
  });

  const completedCount = computed(() => {
    return todos.value.filter(todo => todo.completed).length;
  });

  const totalCount = computed(() => todos.value.length);

  // 按优先级分组
  const todosByPriority = computed(() => {
    const groups: { [key: number]: Todo[] } = {};
    filteredTodos.value.forEach(todo => {
      if (!groups[todo.priority]) {
        groups[todo.priority] = [];
      }
      groups[todo.priority].push(todo);
    });
    return groups;
  });

  // 按分类分组
  const todosByCategory = computed(() => {
    const groups: { [key: string]: Todo[] } = {};
    filteredTodos.value.forEach(todo => {
      if (!groups[todo.category]) {
        groups[todo.category] = [];
      }
      groups[todo.category].push(todo);
    });
    return groups;
  });

  // 方法
  /**
   * 获取待办事项列表
   */
  const fetchTodos = async (completed?: boolean) => {
    const authStore = useAuthStore();
    if (!authStore.isAuthenticated) {
      todos.value = [];
      return;
    }
    
    try {
      loading.value = true;
      // 优先从Supabase获取数据
      const data = await SupabaseTodoService.getAll(completed);
      todos.value = data;
    } catch (error) {
      console.error('Failed to fetch todos from Supabase:', error);
      // 如果Supabase失败，尝试从MongoDB获取
      try {
        const data = await TodoAPI.getList(completed);
        todos.value = data;
        ElMessage.warning('从备份数据库获取数据');
      } catch (mongoError) {
        console.error('Failed to fetch todos from MongoDB:', mongoError);
        ElMessage.error('获取待办事项失败');
      }
    } finally {
      loading.value = false;
    }
  };

  /**
   * 创建待办事项
   */
  const createTodo = async (request: CreateTodoRequest) => {
    try {
      loading.value = true;
      
      // 先保存到Supabase
      const id = await SupabaseTodoService.create(request);
      
      // 异步备份到MongoDB
      try {
        await TodoAPI.create(request);
      } catch (mongoError) {
        console.warn('MongoDB backup failed:', mongoError);
      }
      
      // 重新获取列表
      await fetchTodos();
      
      ElMessage.success('创建成功');
      return id;
    } catch (error) {
      console.error('Failed to create todo:', error);
      ElMessage.error('创建失败');
      throw error;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 更新待办事项
   */
  const updateTodo = async (id: string, request: UpdateTodoRequest) => {
    try {
      loading.value = true;
      
      // 先更新Supabase
      await SupabaseTodoService.update(id, request);
      
      // 异步备份到MongoDB
      try {
        await TodoAPI.update(id, request);
      } catch (mongoError) {
        console.warn('MongoDB backup failed:', mongoError);
      }
      
      // 重新获取列表
      await fetchTodos();
      
      ElMessage.success('更新成功');
    } catch (error) {
      console.error('Failed to update todo:', error);
      ElMessage.error('更新失败');
      throw error;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 删除待办事项
   */
  const deleteTodo = async (id: string) => {
    try {
      loading.value = true;
      
      // 先从Supabase删除
      await SupabaseTodoService.delete(id);
      
      // 异步从MongoDB删除
      try {
        await TodoAPI.delete(id);
      } catch (mongoError) {
        console.warn('MongoDB backup deletion failed:', mongoError);
      }
      
      // 重新获取列表
      await fetchTodos();
      
      ElMessage.success('删除成功');
    } catch (error) {
      console.error('Failed to delete todo:', error);
      ElMessage.error('删除失败');
      throw error;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 切换完成状态
   */
  const toggleCompletion = async (id: string) => {
    try {
      // 先在Supabase切换
      await SupabaseTodoService.toggleCompletion(id);
      
      // 异步在MongoDB切换
      try {
        await TodoAPI.toggleCompletion(id);
      } catch (mongoError) {
        console.warn('MongoDB backup toggle failed:', mongoError);
      }
      
      // 重新获取列表
      await fetchTodos();
    } catch (error) {
      console.error('Failed to toggle todo completion:', error);
      ElMessage.error('操作失败');
      throw error;
    }
  };

  /**
   * 设置过滤器
   */
  const setFilter = (filter: 'all' | 'pending' | 'completed') => {
    currentFilter.value = filter;
  };

  /**
   * 根据ID查找待办事项
   */
  const findTodoById = (id: string): Todo | undefined => {
    return todos.value.find(todo => todo.id === id);
  };

  return {
    // 状态
    todos,
    loading,
    currentFilter,
    
    // 计算属性
    filteredTodos,
    pendingCount,
    completedCount,
    totalCount,
    todosByPriority,
    todosByCategory,
    
    // 方法
    fetchTodos,
    createTodo,
    updateTodo,
    deleteTodo,
    toggleCompletion,
    setFilter,
    findTodoById,
  };
});