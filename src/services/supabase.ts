/**
 * Supabase数据服务层
 */
import { supabase, TABLES, type SupabaseTodo, type SupabaseIdea } from '../lib/supabase'
import type { Todo, Idea, CreateTodoRequest, UpdateTodoRequest, CreateIdeaRequest, UpdateIdeaRequest } from '../types'

/**
 * Todo相关的Supabase服务
 */
export class SupabaseTodoService {
  /**
   * 获取当前用户的所有待办事项
   */
  static async getAll(completed?: boolean): Promise<Todo[]> {
    let query = supabase
      .from(TABLES.TODOS)
      .select('*')
      .order('created_at', { ascending: false })
    
    if (completed !== undefined) {
      query = query.eq('completed', completed)
    }
    
    const { data, error } = await query
    
    if (error) {
      throw new Error(`获取待办事项失败: ${error.message}`)
    }
    
    return data?.map(this.transformFromSupabase) || []
  }
  
  /**
   * 根据ID获取待办事项
   */
  static async getById(id: string): Promise<Todo | null> {
    const { data, error } = await supabase
      .from(TABLES.TODOS)
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null // 未找到记录
      }
      throw new Error(`获取待办事项失败: ${error.message}`)
    }
    
    return data ? this.transformFromSupabase(data) : null
  }
  
  /**
   * 创建新的待办事项
   */
  static async create(request: CreateTodoRequest): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('用户未登录')
    }
    
    const todoData: Omit<SupabaseTodo, 'id' | 'created_at' | 'updated_at'> = {
      user_id: user.id,
      title: request.title,
      description: request.description || null,
      completed: false,
      priority: request.priority || 3,
      due_date: request.due_date || null,
      tags: request.tags || [],
      category: request.category || 'general'
    }
    
    const { data, error } = await supabase
      .from(TABLES.TODOS)
      .insert(todoData)
      .select('id')
      .single()
    
    if (error) {
      throw new Error(`创建待办事项失败: ${error.message}`)
    }
    
    return data.id
  }
  
  /**
   * 更新待办事项
   */
  static async update(id: string, request: UpdateTodoRequest): Promise<boolean> {
    const updateData: Partial<SupabaseTodo> = {}
    
    if (request.title !== undefined) updateData.title = request.title
    if (request.description !== undefined) updateData.description = request.description
    if (request.completed !== undefined) updateData.completed = request.completed
    if (request.priority !== undefined) updateData.priority = request.priority
    if (request.due_date !== undefined) updateData.due_date = request.due_date
    if (request.tags !== undefined) updateData.tags = request.tags
    if (request.category !== undefined) updateData.category = request.category
    
    const { error } = await supabase
      .from(TABLES.TODOS)
      .update(updateData)
      .eq('id', id)
    
    if (error) {
      throw new Error(`更新待办事项失败: ${error.message}`)
    }
    
    return true
  }
  
  /**
   * 删除待办事项
   */
  static async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from(TABLES.TODOS)
      .delete()
      .eq('id', id)
    
    if (error) {
      throw new Error(`删除待办事项失败: ${error.message}`)
    }
    
    return true
  }
  
  /**
   * 切换完成状态
   */
  static async toggleCompletion(id: string): Promise<boolean> {
    // 先获取当前状态
    const todo = await this.getById(id)
    if (!todo) {
      throw new Error('待办事项不存在')
    }
    
    return await this.update(id, { completed: !todo.completed })
  }
  
  /**
   * 转换Supabase数据格式到应用数据格式
   */
  private static transformFromSupabase(data: SupabaseTodo): Todo {
    return {
      id: data.id,
      title: data.title,
      description: data.description || undefined,
      completed: data.completed,
      priority: data.priority,
      due_date: data.due_date || undefined,
      created_at: data.created_at,
      updated_at: data.updated_at,
      tags: data.tags,
      category: data.category
    }
  }
}

/**
 * Idea相关的Supabase服务
 */
export class SupabaseIdeaService {
  /**
   * 获取当前用户的所有想法记录
   */
  static async getAll(isFavorite?: boolean): Promise<Idea[]> {
    let query = supabase
      .from(TABLES.IDEAS)
      .select('*')
      .order('created_at', { ascending: false })
    
    if (isFavorite !== undefined) {
      query = query.eq('is_favorite', isFavorite)
    }
    
    const { data, error } = await query
    
    if (error) {
      throw new Error(`获取想法记录失败: ${error.message}`)
    }
    
    return data?.map(this.transformFromSupabase) || []
  }
  
  /**
   * 根据ID获取想法记录
   */
  static async getById(id: string): Promise<Idea | null> {
    const { data, error } = await supabase
      .from(TABLES.IDEAS)
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null // 未找到记录
      }
      throw new Error(`获取想法记录失败: ${error.message}`)
    }
    
    return data ? this.transformFromSupabase(data) : null
  }
  
  /**
   * 创建新的想法记录
   */
  static async create(request: CreateIdeaRequest): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('用户未登录')
    }
    
    const ideaData: Omit<SupabaseIdea, 'id' | 'created_at' | 'updated_at'> = {
      user_id: user.id,
      title: request.title,
      content: request.content,
      tags: request.tags || [],
      is_favorite: request.is_favorite || false,
      category: request.category || 'general'
    }
    
    const { data, error } = await supabase
      .from(TABLES.IDEAS)
      .insert(ideaData)
      .select('id')
      .single()
    
    if (error) {
      throw new Error(`创建想法记录失败: ${error.message}`)
    }
    
    return data.id
  }
  
  /**
   * 更新想法记录
   */
  static async update(id: string, request: UpdateIdeaRequest): Promise<boolean> {
    const updateData: Partial<SupabaseIdea> = {}
    
    if (request.title !== undefined) updateData.title = request.title
    if (request.content !== undefined) updateData.content = request.content
    if (request.tags !== undefined) updateData.tags = request.tags
    if (request.is_favorite !== undefined) updateData.is_favorite = request.is_favorite
    if (request.category !== undefined) updateData.category = request.category
    
    const { error } = await supabase
      .from(TABLES.IDEAS)
      .update(updateData)
      .eq('id', id)
    
    if (error) {
      throw new Error(`更新想法记录失败: ${error.message}`)
    }
    
    return true
  }
  
  /**
   * 删除想法记录
   */
  static async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from(TABLES.IDEAS)
      .delete()
      .eq('id', id)
    
    if (error) {
      throw new Error(`删除想法记录失败: ${error.message}`)
    }
    
    return true
  }
  
  /**
   * 切换收藏状态
   */
  static async toggleFavorite(id: string): Promise<boolean> {
    // 先获取当前状态
    const idea = await this.getById(id)
    if (!idea) {
      throw new Error('想法记录不存在')
    }
    
    return await this.update(id, { is_favorite: !idea.is_favorite })
  }
  
  /**
   * 转换Supabase数据格式到应用数据格式
   */
  private static transformFromSupabase(data: SupabaseIdea): Idea {
    return {
      id: data.id,
      title: data.title,
      content: data.content,
      created_at: data.created_at,
      updated_at: data.updated_at,
      tags: data.tags,
      is_favorite: data.is_favorite,
      category: data.category
    }
  }
}