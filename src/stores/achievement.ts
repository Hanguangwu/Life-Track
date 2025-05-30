/**
 * 成就日记状态管理
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Achievement, CreateAchievementRequest, UpdateAchievementRequest } from '../types'
import { SupabaseAchievementService } from '../services/supabase'

export const useAchievementStore = defineStore('achievement', () => {
  // 状态
  const achievements = ref<Achievement[]>([])
  const loading = ref(false)
  const currentFilter = ref<'all' | 'recent' | 'tagged'>('all')
  const selectedTags = ref<string[]>([])
  const dateRange = ref<{ start: string; end: string } | null>(null)

  // 计算属性
  const filteredAchievements = computed(() => {
    let filtered = achievements.value

    // 按标签过滤
    if (selectedTags.value.length > 0) {
      filtered = filtered.filter(achievement => 
        achievement.tags.some(tag => selectedTags.value.includes(tag))
      )
    }

    // 按日期范围过滤
    if (dateRange.value) {
      filtered = filtered.filter(achievement => 
        achievement.date >= dateRange.value!.start && 
        achievement.date <= dateRange.value!.end
      )
    }

    return filtered
  })

  const totalCount = computed(() => achievements.value.length)

  const recentAchievements = computed(() => {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0]
    
    return achievements.value.filter(achievement => 
      achievement.date >= thirtyDaysAgoStr
    )
  })

  const allTags = computed(() => {
    const tagSet = new Set<string>()
    achievements.value.forEach(achievement => {
      achievement.tags.forEach(tag => tagSet.add(tag))
    })
    return Array.from(tagSet).sort()
  })

  const achievementsByMonth = computed(() => {
    const grouped: Record<string, Achievement[]> = {}
    achievements.value.forEach(achievement => {
      const month = achievement.date.substring(0, 7) // YYYY-MM
      if (!grouped[month]) {
        grouped[month] = []
      }
      grouped[month].push(achievement)
    })
    return grouped
  })

  // 方法
  const fetchAchievements = async () => {
    try {
      loading.value = true
      achievements.value = await SupabaseAchievementService.getAll()
    } catch (error) {
      console.error('获取成就日记失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const createAchievement = async (request: CreateAchievementRequest): Promise<Achievement> => {
    try {
      loading.value = true
      const newAchievement = await SupabaseAchievementService.create(request)
      achievements.value.unshift(newAchievement)
      return newAchievement
    } catch (error) {
      console.error('创建成就日记失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const updateAchievement = async (id: string, request: UpdateAchievementRequest): Promise<boolean> => {
    try {
      loading.value = true
      const success = await SupabaseAchievementService.update(id, request)
      if (success) {
        // 重新获取更新后的数据
        const updatedAchievement = await SupabaseAchievementService.getById(id)
        if (updatedAchievement) {
          const index = achievements.value.findIndex(a => a.id === id)
          if (index !== -1) {
            achievements.value[index] = updatedAchievement
          }
        }
      }
      return success
    } catch (error) {
      console.error('更新成就日记失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const deleteAchievement = async (id: string): Promise<boolean> => {
    try {
      loading.value = true
      const success = await SupabaseAchievementService.delete(id)
      if (success) {
        achievements.value = achievements.value.filter(a => a.id !== id)
      }
      return success
    } catch (error) {
      console.error('删除成就日记失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const deleteAchievementImage = async (achievementId: string, imageIndex: number): Promise<boolean> => {
    try {
      loading.value = true
      const success = await SupabaseAchievementService.deleteImage(achievementId, imageIndex)
      if (success) {
        // 重新获取更新后的数据
        const updatedAchievement = await SupabaseAchievementService.getById(achievementId)
        if (updatedAchievement) {
          const index = achievements.value.findIndex(a => a.id === achievementId)
          if (index !== -1) {
            achievements.value[index] = updatedAchievement
          }
        }
      }
      return success
    } catch (error) {
      console.error('删除图片失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const getAchievementById = async (id: string): Promise<Achievement | null> => {
    try {
      return await SupabaseAchievementService.getById(id)
    } catch (error) {
      console.error('获取成就日记详情失败:', error)
      throw error
    }
  }

  const searchByTags = async (tags: string[]): Promise<Achievement[]> => {
    try {
      loading.value = true
      return await SupabaseAchievementService.searchByTags(tags)
    } catch (error) {
      console.error('搜索成就日记失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const getByDateRange = async (startDate: string, endDate: string): Promise<Achievement[]> => {
    try {
      loading.value = true
      return await SupabaseAchievementService.getByDateRange(startDate, endDate)
    } catch (error) {
      console.error('获取日期范围内的成就日记失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const setFilter = (filter: 'all' | 'recent' | 'tagged') => {
    currentFilter.value = filter
  }

  const setSelectedTags = (tags: string[]) => {
    selectedTags.value = tags
  }

  const setDateRange = (range: { start: string; end: string } | null) => {
    dateRange.value = range
  }

  const clearFilters = () => {
    currentFilter.value = 'all'
    selectedTags.value = []
    dateRange.value = null
  }

  return {
    // 状态
    achievements,
    loading,
    currentFilter,
    selectedTags,
    dateRange,
    
    // 计算属性
    filteredAchievements,
    totalCount,
    recentAchievements,
    allTags,
    achievementsByMonth,
    
    // 方法
    fetchAchievements,
    createAchievement,
    updateAchievement,
    deleteAchievement,
    deleteAchievementImage,
    getAchievementById,
    searchByTags,
    getByDateRange,
    setFilter,
    setSelectedTags,
    setDateRange,
    clearFilters
  }
})