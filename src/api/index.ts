import { invoke } from '@tauri-apps/api/core';
import type {
  Todo,
  CreateTodoRequest,
  UpdateTodoRequest,
  Idea,
  CreateIdeaRequest,
  UpdateIdeaRequest,
} from '../types';

/**
 * Todo相关API
 */
export class TodoAPI {
  /**
   * 创建待办事项
   */
  static async create(request: CreateTodoRequest): Promise<string> {
    return await invoke('create_todo', { request });
  }

  /**
   * 获取待办事项列表
   */
  static async getList(completed?: boolean): Promise<Todo[]> {
    return await invoke('get_todos', { completed });
  }

  /**
   * 根据ID获取待办事项
   */
  static async getById(id: string): Promise<Todo | null> {
    return await invoke('get_todo_by_id', { id });
  }

  /**
   * 更新待办事项
   */
  static async update(id: string, request: UpdateTodoRequest): Promise<boolean> {
    return await invoke('update_todo', { id, request });
  }

  /**
   * 删除待办事项
   */
  static async delete(id: string): Promise<boolean> {
    return await invoke('delete_todo', { id });
  }

  /**
   * 切换完成状态
   */
  static async toggleCompletion(id: string): Promise<boolean> {
    return await invoke('toggle_todo_completion', { id });
  }
}

/**
 * Idea相关API
 */
export class IdeaAPI {
  /**
   * 创建想法记录
   */
  static async create(request: CreateIdeaRequest): Promise<string> {
    return await invoke('create_idea', { request });
  }

  /**
   * 获取想法记录列表
   */
  static async getList(isFavorite?: boolean): Promise<Idea[]> {
    return await invoke('get_ideas', { is_favorite: isFavorite });
  }

  /**
   * 根据ID获取想法记录
   */
  static async getById(id: string): Promise<Idea | null> {
    return await invoke('get_idea_by_id', { id });
  }

  /**
   * 更新想法记录
   */
  static async update(id: string, request: UpdateIdeaRequest): Promise<boolean> {
    return await invoke('update_idea', { id, request });
  }

  /**
   * 删除想法记录
   */
  static async delete(id: string): Promise<boolean> {
    return await invoke('delete_idea', { id });
  }

  /**
   * 切换收藏状态
   */
  static async toggleFavorite(id: string): Promise<boolean> {
    return await invoke('toggle_idea_favorite', { id });
  }

  /**
   * 搜索想法记录
   */
  static async search(keyword: string): Promise<Idea[]> {
    return await invoke('search_ideas', { keyword });
  }
}