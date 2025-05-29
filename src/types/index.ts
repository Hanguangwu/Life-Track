/**
 * 待办事项接口定义
 */
export interface Todo {
  id?: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: number;
  due_date?: string;
  created_at: string;
  updated_at: string;
  tags: string[];
  category: string;
}

/**
 * 创建待办事项请求接口
 */
export interface CreateTodoRequest {
  title: string;
  description?: string;
  priority?: number;
  due_date?: string;
  tags?: string[];
  category?: string;
}

/**
 * 更新待办事项请求接口
 */
export interface UpdateTodoRequest {
  title?: string;
  description?: string;
  completed?: boolean;
  priority?: number;
  due_date?: string;
  tags?: string[];
  category?: string;
}

/**
 * 想法记录接口定义
 */
export interface Idea {
  id?: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  tags: string[];
  is_favorite: boolean;
  category: string;
}

/**
 * 创建想法请求接口
 */
export interface CreateIdeaRequest {
  title: string;
  content: string;
  tags?: string[];
  is_favorite?: boolean;
  category?: string;
}

/**
 * 更新想法请求接口
 */
export interface UpdateIdeaRequest {
  title?: string;
  content?: string;
  tags?: string[];
  is_favorite?: boolean;
  category?: string;
}

/**
 * 优先级选项
 */
export const PRIORITY_OPTIONS = [
  { label: '最高', value: 1, color: '#ff4757' },
  { label: '高', value: 2, color: '#ff6b35' },
  { label: '中', value: 3, color: '#ffa502' },
  { label: '低', value: 4, color: '#70a1ff' },
  { label: '最低', value: 5, color: '#7bed9f' },
];

/**
 * 分类选项
 */
export const CATEGORY_OPTIONS = [
  '工作',
  '学习',
  '生活',
  '健康',
  '娱乐',
  '其他',
];