import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { IdeaAPI } from '../api';
import { SupabaseIdeaService } from '../services/supabase';
import type { Idea, CreateIdeaRequest, UpdateIdeaRequest } from '../types';
import { ElMessage } from 'element-plus';
import { useAuthStore } from './auth';

/**
 * 想法记录状态管理
 */
export const useIdeaStore = defineStore('idea', () => {
  // 状态
  const ideas = ref<Idea[]>([]);
  const loading = ref(false);
  const searchKeyword = ref('');
  const currentFilter = ref<'all' | 'favorites'>('all');

  // 计算属性
  const filteredIdeas = computed(() => {
    let result = ideas.value;
    
    // 按收藏状态过滤
    if (currentFilter.value === 'favorites') {
      result = result.filter(idea => idea.is_favorite);
    }
    
    // 按关键词搜索
    if (searchKeyword.value.trim()) {
      const keyword = searchKeyword.value.toLowerCase();
      result = result.filter(idea => 
        idea.title.toLowerCase().includes(keyword) ||
        idea.content.toLowerCase().includes(keyword) ||
        idea.tags.some(tag => tag.toLowerCase().includes(keyword))
      );
    }
    
    return result;
  });

  const favoriteCount = computed(() => {
    return ideas.value.filter(idea => idea.is_favorite).length;
  });

  const totalCount = computed(() => ideas.value.length);

  // 按标签分组
  const ideasByTags = computed(() => {
    const groups: { [key: string]: Idea[] } = {};
    filteredIdeas.value.forEach(idea => {
      idea.tags.forEach(tag => {
        if (!groups[tag]) {
          groups[tag] = [];
        }
        groups[tag].push(idea);
      });
    });
    return groups;
  });

  // 获取所有标签
  const allTags = computed(() => {
    const tagSet = new Set<string>();
    ideas.value.forEach(idea => {
      idea.tags.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  });

  // 方法
  /**
   * 加载想法记录列表
   */
  const loadIdeas = async (isFavorite?: boolean) => {
    const authStore = useAuthStore();
    if (!authStore.isAuthenticated) {
      ideas.value = [];
      return;
    }
    
    try {
      loading.value = true;
      // 优先从Supabase获取数据
      const data = await SupabaseIdeaService.getAll(isFavorite);
      ideas.value = data;
    } catch (error) {
      console.error('Failed to fetch ideas from Supabase:', error);
      // 如果Supabase失败，尝试从MongoDB获取
      try {
        const data = await IdeaAPI.getList(isFavorite);
        ideas.value = data;
        ElMessage.warning('从备份数据库获取数据');
      } catch (mongoError) {
        console.error('Failed to fetch ideas from MongoDB:', mongoError);
        ElMessage.error('获取想法记录失败');
      }
    } finally {
      loading.value = false;
    }
  };

  /**
   * 创建想法记录
   */
  const createIdea = async (request: CreateIdeaRequest) => {
    try {
      loading.value = true;
      
      // 先保存到Supabase
      const id = await SupabaseIdeaService.create(request);
      
      // 异步备份到MongoDB
      try {
        await IdeaAPI.create(request);
      } catch (mongoError) {
        console.warn('MongoDB backup failed:', mongoError);
      }
      
      // 重新获取列表
      await loadIdeas();
      
      ElMessage.success('创建成功');
      return id;
    } catch (error) {
      console.error('Failed to create idea:', error);
      ElMessage.error('创建失败');
      throw error;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 更新想法记录
   */
  const updateIdea = async (id: string, request: UpdateIdeaRequest) => {
    try {
      loading.value = true;
      
      // 先更新Supabase
      await SupabaseIdeaService.update(id, request);
      
      // 异步备份到MongoDB
      try {
        await IdeaAPI.update(id, request);
      } catch (mongoError) {
        console.warn('MongoDB backup failed:', mongoError);
      }
      
      // 重新获取列表
      await loadIdeas();
      
      ElMessage.success('更新成功');
    } catch (error) {
      console.error('Failed to update idea:', error);
      ElMessage.error('更新失败');
      throw error;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 删除想法记录
   */
  const deleteIdea = async (id: string) => {
    try {
      loading.value = true;
      
      // 先从Supabase删除
      await SupabaseIdeaService.delete(id);
      
      // 异步从MongoDB删除
      try {
        await IdeaAPI.delete(id);
      } catch (mongoError) {
        console.warn('MongoDB backup deletion failed:', mongoError);
      }
      
      // 重新获取列表
      await loadIdeas();
      
      ElMessage.success('删除成功');
    } catch (error) {
      console.error('Failed to delete idea:', error);
      ElMessage.error('删除失败');
      throw error;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 切换收藏状态
   */
  const toggleFavorite = async (id: string) => {
    try {
      // 先在Supabase切换
      await SupabaseIdeaService.toggleFavorite(id);
      
      // 异步在MongoDB切换
      try {
        await IdeaAPI.toggleFavorite(id);
      } catch (mongoError) {
        console.warn('MongoDB backup toggle failed:', mongoError);
      }
      
      // 重新获取列表
      await loadIdeas();
    } catch (error) {
      console.error('Failed to toggle idea favorite:', error);
      ElMessage.error('操作失败');
      throw error;
    }
  };

  /**
   * 搜索想法记录
   */
  const searchIdeas = async (keyword: string) => {
    try {
      loading.value = true;
      const result = await IdeaAPI.search(keyword);
      ideas.value = result;
    } catch (error) {
      console.error('Failed to search ideas:', error);
      ElMessage.error('搜索失败');
    } finally {
      loading.value = false;
    }
  };

  /**
   * 设置搜索关键词
   */
  const setSearchKeyword = (keyword: string) => {
    searchKeyword.value = keyword;
  };

  /**
   * 设置过滤器
   */
  const setFilter = (filter: 'all' | 'favorites') => {
    currentFilter.value = filter;
  };

  /**
   * 根据ID查找想法记录
   */
  const findIdeaById = (id: string): Idea | undefined => {
    return ideas.value.find(idea => idea.id === id);
  };

  /**
   * 清空搜索
   */
  const clearSearch = () => {
    searchKeyword.value = '';
  };

  return {
    // 状态
    ideas,
    loading,
    searchKeyword,
    currentFilter,
    
    // 计算属性
    filteredIdeas,
    favoriteCount,
    totalCount,
    ideasByTags,
    allTags,
    
    // 方法
    loadIdeas,
    createIdea,
    updateIdea,
    deleteIdea,
    toggleFavorite,
    searchIdeas,
    setSearchKeyword,
    setFilter,
    findIdeaById,
    clearSearch,
  };
});