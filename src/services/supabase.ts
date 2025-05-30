/**
 * Supabase数据服务层
 */
import { supabase, TABLES, type SupabaseTodo, type SupabaseIdea, type SupabaseAchievement } from '../lib/supabase'
import type { Todo, Idea, Achievement, CreateTodoRequest, UpdateTodoRequest, CreateIdeaRequest, UpdateIdeaRequest, CreateAchievementRequest, UpdateAchievementRequest } from '../types'
import { CloudflareR2Service } from './cloudflare-r2'

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

/**
 * 成就日记相关的Supabase服务
 */
export class SupabaseAchievementService {
  /**
   * 获取当前用户的所有成就日记
   */
  static async getAll(): Promise<Achievement[]> {
    const { data, error } = await supabase
      .from(TABLES.ACHIEVEMENTS)
      .select('*')
      .order('date', { ascending: false })
    
    if (error) {
      throw new Error(`获取成就日记失败: ${error.message}`)
    }
    
    return data?.map(this.transformFromSupabase) || []
  }
  
  /**
   * 根据ID获取成就日记
   */
  static async getById(id: string): Promise<Achievement | null> {
    const { data, error } = await supabase
      .from(TABLES.ACHIEVEMENTS)
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null // 未找到记录
      }
      throw new Error(`获取成就日记失败: ${error.message}`)
    }
    
    return data ? this.transformFromSupabase(data) : null
  }
  
  /**
   * 创建新的成就日记
   */
  static async create(request: CreateAchievementRequest): Promise<Achievement> {
    try {
      // 上传图片到R2
      let imageUrls: string[] = []
      let imageTimestamps: string[] = []
      
      if (request.images && request.images.length > 0) {
        const uploadResult = await CloudflareR2Service.uploadImages(request.images)
        imageUrls = uploadResult.urls
        imageTimestamps = uploadResult.timestamps
      }
      
      // 获取当前用户ID
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('用户未登录')
      }

      // 准备数据库数据
      const achievementData: Omit<SupabaseAchievement, 'id' | 'created_at' | 'updated_at'> = {
        user_id: user.id,
        title: request.title,
        content: request.content,
        date: request.date,
        images: imageUrls,
        image_timestamps: imageTimestamps,
        tags: request.tags || []
      }
      
      // 插入数据库
      const { data, error } = await supabase
        .from(TABLES.ACHIEVEMENTS)
        .insert([achievementData])
        .select()
        .single()
      
      if (error) {
        // 如果数据库插入失败，删除已上传的图片
        if (imageTimestamps.length > 0) {
          try {
            await CloudflareR2Service.deleteImages(imageTimestamps)
          } catch (deleteError) {
            console.error('删除上传的图片失败:', deleteError)
          }
        }
        throw new Error(`创建成就日记失败: ${error.message}`)
      }
      
      return this.transformFromSupabase(data)
    } catch (error) {
      console.error('创建成就日记失败:', error)
      throw error
    }
  }
  
  /**
   * 更新成就日记
   */
  static async update(id: string, request: UpdateAchievementRequest): Promise<boolean> {
    try {
      // 获取现有记录
      const existingAchievement = await this.getById(id)
      if (!existingAchievement) {
        throw new Error('成就日记不存在')
      }
      
      // 处理新图片上传
      let newImageUrls: string[] = existingAchievement.images
      let newImageTimestamps: string[] = existingAchievement.image_timestamps
      
      if (request.images && request.images.length > 0) {
        const uploadResult = await CloudflareR2Service.uploadImages(request.images)
        newImageUrls = [...newImageUrls, ...uploadResult.urls]
        newImageTimestamps = [...newImageTimestamps, ...uploadResult.timestamps]
      }
      
      // 准备更新数据
      const updateData: Partial<SupabaseAchievement> = {
        updated_at: new Date().toISOString()
      }
      
      if (request.title !== undefined) updateData.title = request.title
      if (request.content !== undefined) updateData.content = request.content
      if (request.date !== undefined) updateData.date = request.date
      if (request.tags !== undefined) updateData.tags = request.tags
      
      // 更新图片信息
      updateData.images = newImageUrls
      updateData.image_timestamps = newImageTimestamps
      
      // 更新数据库
      const { error } = await supabase
        .from(TABLES.ACHIEVEMENTS)
        .update(updateData)
        .eq('id', id)
      
      if (error) {
        throw new Error(`更新成就日记失败: ${error.message}`)
      }
      
      return true
    } catch (error) {
      console.error('更新成就日记失败:', error)
      throw error
    }
  }
  
  /**
   * 删除成就日记
   */
  static async delete(id: string): Promise<boolean> {
    try {
      // 获取要删除的记录
      const achievement = await this.getById(id)
      if (!achievement) {
        throw new Error('成就日记不存在')
      }
      
      // 删除数据库记录
      const { error } = await supabase
        .from(TABLES.ACHIEVEMENTS)
        .delete()
        .eq('id', id)
      
      if (error) {
        throw new Error(`删除成就日记失败: ${error.message}`)
      }
      
      // 删除R2中的图片
      if (achievement.image_timestamps.length > 0) {
        try {
          await CloudflareR2Service.deleteImages(achievement.image_timestamps)
        } catch (deleteError) {
          console.error('删除R2图片失败:', deleteError)
          // 不抛出错误，因为数据库记录已经删除
        }
      }
      
      return true
    } catch (error) {
      console.error('删除成就日记失败:', error)
      throw error
    }
  }
  
  /**
   * 删除成就日记中的特定图片
   */
  static async deleteImage(achievementId: string, imageIndex: number): Promise<boolean> {
    try {
      const achievement = await this.getById(achievementId)
      if (!achievement) {
        throw new Error('成就日记不存在')
      }
      
      if (imageIndex < 0 || imageIndex >= achievement.images.length) {
        throw new Error('图片索引无效')
      }
      
      // 获取要删除的图片时间戳
      const timestampToDelete = achievement.image_timestamps[imageIndex]
      
      // 从数组中移除图片
      const newImages = achievement.images.filter((_, index) => index !== imageIndex)
      const newTimestamps = achievement.image_timestamps.filter((_, index) => index !== imageIndex)
      
      // 更新数据库
      const { error } = await supabase
        .from(TABLES.ACHIEVEMENTS)
        .update({
          images: newImages,
          image_timestamps: newTimestamps,
          updated_at: new Date().toISOString()
        })
        .eq('id', achievementId)
      
      if (error) {
        throw new Error(`删除图片失败: ${error.message}`)
      }
      
      // 删除R2中的图片
      try {
        await CloudflareR2Service.deleteImage(timestampToDelete)
      } catch (deleteError) {
        console.error('删除R2图片失败:', deleteError)
        // 不抛出错误，因为数据库已经更新
      }
      
      return true
    } catch (error) {
      console.error('删除图片失败:', error)
      throw error
    }
  }
  
  /**
   * 根据日期范围获取成就日记
   */
  static async getByDateRange(startDate: string, endDate: string): Promise<Achievement[]> {
    const { data, error } = await supabase
      .from(TABLES.ACHIEVEMENTS)
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false })
    
    if (error) {
      throw new Error(`获取成就日记失败: ${error.message}`)
    }
    
    return data?.map(this.transformFromSupabase) || []
  }
  
  /**
   * 根据标签搜索成就日记
   */
  static async searchByTags(tags: string[]): Promise<Achievement[]> {
    const { data, error } = await supabase
      .from(TABLES.ACHIEVEMENTS)
      .select('*')
      .overlaps('tags', tags)
      .order('date', { ascending: false })
    
    if (error) {
      throw new Error(`搜索成就日记失败: ${error.message}`)
    }
    
    return data?.map(this.transformFromSupabase) || []
  }
  
  /**
   * 转换Supabase数据格式到应用数据格式
   */
  private static transformFromSupabase(data: SupabaseAchievement): Achievement {
    return {
      id: data.id,
      title: data.title,
      content: data.content,
      date: data.date,
      images: data.images,
      image_timestamps: data.image_timestamps,
      tags: data.tags,
      created_at: data.created_at,
      updated_at: data.updated_at
    }
  }
}