<template>
  <div class="idea-list-page">
    <!-- 头部操作区 -->
    <div class="header-actions card">
      <div class="left-actions">
        <el-button type="primary" @click="showCreateDialog = true">
          <el-icon><Plus /></el-icon>
          新建想法
        </el-button>
        
        <el-radio-group v-model="currentFilter" @change="handleFilterChange">
          <el-radio-button value="all">全部 ({{ ideaStore.totalCount }})</el-radio-button>
          <el-radio-button value="favorites">收藏 ({{ ideaStore.favoriteCount }})</el-radio-button>
        </el-radio-group>
      </div>
      
      <div class="right-actions">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索想法..."
          style="width: 200px"
          clearable
          @input="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        
        <el-select v-model="sortBy" placeholder="排序方式" style="width: 120px">
          <el-option label="创建时间" value="created_at" />
          <el-option label="更新时间" value="updated_at" />
          <el-option label="标题" value="title" />
        </el-select>
        
        <el-button :icon="Refresh" @click="refreshData" :loading="ideaStore.loading">
          刷新
        </el-button>
      </div>
    </div>

    <!-- 标签过滤器 -->
    <div v-if="allTags.length > 0" class="tag-filter card">
      <div class="filter-label">按标签筛选：</div>
      <div class="tag-list">
        <el-tag
          v-for="tag in allTags"
          :key="tag"
          :type="selectedTags.includes(tag) ? 'primary' : 'info'"
          :effect="selectedTags.includes(tag) ? 'dark' : 'plain'"
          @click="toggleTag(tag)"
          style="cursor: pointer; margin-right: 8px; margin-bottom: 8px;"
        >
          {{ tag }}
        </el-tag>
        <el-button
          v-if="selectedTags.length > 0"
          size="small"
          type="danger"
          text
          @click="clearTagFilter"
        >
          清除筛选
        </el-button>
      </div>
    </div>

    <!-- 想法列表 -->
    <div class="idea-container">
      <div v-loading="ideaStore.loading">
        <div v-if="sortedIdeas.length === 0" class="empty-state card">
          <el-icon size="64" color="#c0c4cc"><Memo /></el-icon>
          <h3>暂无想法记录</h3>
          <p>点击上方按钮记录您的第一个想法</p>
        </div>
        
        <div v-else class="idea-grid">
          <el-card 
            v-for="idea in sortedIdeas" 
            :key="idea.id" 
            class="idea-card"
            shadow="hover"
          >
            <div class="idea-header">
              <div class="idea-title">
                <h3>{{ idea.title }}</h3>
                <el-button 
                  :type="idea.is_favorite ? 'warning' : 'info'" 
                  :icon="idea.is_favorite ? StarFilled : Star" 
                  circle 
                  size="small"
                  @click="toggleFavorite(idea.id!)"
                />
              </div>
              <div class="idea-actions">
                <el-button 
                  type="primary" 
                  size="small" 
                  :icon="Edit" 
                  circle 
                  @click="editIdea(idea)"
                />
                <el-button 
                  type="danger" 
                  size="small" 
                  :icon="Delete" 
                  circle 
                  @click="deleteIdea(idea.id!)"
                />
              </div>
            </div>
            
            <div class="idea-content">
              <p>{{ idea.content }}</p>
            </div>
            
            <div class="idea-meta">
              <div class="meta-left">
                <el-tag type="info" size="small">{{ idea.category }}</el-tag>
                <div v-if="idea.tags.length > 0" class="tags">
                  <el-tag 
                    v-for="tag in idea.tags" 
                    :key="tag" 
                    size="small" 
                    effect="plain"
                  >
                    {{ tag }}
                  </el-tag>
                </div>
              </div>
              
              <div class="meta-right">
                <div class="created-date">
                  创建于 {{ formatDate(idea.created_at) }}
                </div>
                <div v-if="idea.updated_at !== idea.created_at" class="updated-date">
                  更新于 {{ formatDate(idea.updated_at) }}
                </div>
              </div>
            </div>
          </el-card>
        </div>
      </div>
    </div>

    <!-- 创建/编辑对话框 -->
    <el-dialog 
      v-model="showCreateDialog" 
      :title="editingIdea ? '编辑想法' : '记录想法'"
      width="600px"
      @close="resetForm"
    >
      <el-form 
        ref="formRef" 
        :model="ideaForm" 
        :rules="formRules" 
        label-width="80px"
      >
        <el-form-item label="标题" prop="title">
          <el-input v-model="ideaForm.title" placeholder="请输入想法标题" />
        </el-form-item>
        
        <el-form-item label="内容" prop="content">
          <el-input 
            v-model="ideaForm.content" 
            type="textarea" 
            :rows="6" 
            placeholder="请输入想法内容"
          />
        </el-form-item>
        
        <el-form-item label="分类">
          <el-select v-model="ideaForm.category" placeholder="选择分类" allow-create filterable>
            <el-option 
              v-for="category in CATEGORY_OPTIONS" 
              :key="category" 
              :label="category" 
              :value="category"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="标签">
          <el-select 
            v-model="ideaForm.tags" 
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
        
        <el-form-item label="收藏">
          <el-switch v-model="ideaForm.is_favorite" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="ideaStore.loading">
          {{ editingIdea ? '更新' : '创建' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive, watch } from 'vue';
import { useIdeaStore } from '../stores/idea';
import { CATEGORY_OPTIONS } from '../types';
import type { Idea, CreateIdeaRequest, UpdateIdeaRequest } from '../types';
import dayjs from 'dayjs';
import { ElMessageBox } from 'element-plus';
import {
  Plus,
  Edit,
  Delete,
  Refresh,
  Search,
  Star,
  StarFilled,
  Memo
} from '@element-plus/icons-vue';

const ideaStore = useIdeaStore();

// 响应式数据
const showCreateDialog = ref(false);
const editingIdea = ref<Idea | null>(null);
const currentFilter = ref<'all' | 'favorites'>('all');
const sortBy = ref('created_at');
const searchKeyword = ref('');
const selectedTags = ref<string[]>([]);
const formRef = ref();

// 表单数据
const ideaForm = reactive({
  title: '',
  content: '',
  category: '工作',
  tags: [] as string[],
  is_favorite: false,
});

// 表单验证规则
const formRules = {
  title: [
    { required: true, message: '请输入想法标题', trigger: 'blur' },
    { min: 1, max: 100, message: '标题长度应在 1 到 100 个字符', trigger: 'blur' },
  ],
  content: [
    { required: true, message: '请输入想法内容', trigger: 'blur' },
    { min: 1, max: 5000, message: '内容长度应在 1 到 5000 个字符', trigger: 'blur' },
  ],
};

// 计算属性
const sortedIdeas = computed(() => {
  let ideas = [...ideaStore.filteredIdeas];
  
  // 按标签过滤
  if (selectedTags.value.length > 0) {
    ideas = ideas.filter(idea => 
      selectedTags.value.some(tag => idea.tags.includes(tag))
    );
  }
  
  // 排序
  ideas.sort((a, b) => {
    switch (sortBy.value) {
      case 'title':
        return a.title.localeCompare(b.title);
      case 'updated_at':
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      default: // created_at
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });
  
  return ideas;
});

// 获取所有标签
const allTags = computed(() => {
  const tagSet = new Set<string>();
  ideaStore.ideas.forEach(idea => {
    idea.tags.forEach(tag => tagSet.add(tag));
  });
  return Array.from(tagSet);
});

// 方法
/**
 * 格式化日期
 */
const formatDate = (dateString: string) => {
  return dayjs(dateString).format('YYYY-MM-DD HH:mm');
};

/**
 * 处理过滤器变化
 */
const handleFilterChange = (filter: 'all' | 'favorites') => {
  ideaStore.setFilter(filter);
};

/**
 * 处理搜索
 */
const handleSearch = () => {
  ideaStore.setSearchKeyword(searchKeyword.value);
};

/**
 * 切换标签过滤
 */
const toggleTag = (tag: string) => {
  const index = selectedTags.value.indexOf(tag);
  if (index > -1) {
    selectedTags.value.splice(index, 1);
  } else {
    selectedTags.value.push(tag);
  }
};

/**
 * 清除标签过滤
 */
const clearTagFilter = () => {
  selectedTags.value = [];
};

/**
 * 刷新数据
 */
const refreshData = async () => {
  await ideaStore.loadIdeas();
};

/**
 * 切换收藏状态
 */
const toggleFavorite = async (id: string) => {
  await ideaStore.toggleFavorite(id);
};

/**
 * 编辑想法
 */
const editIdea = (idea: Idea) => {
  editingIdea.value = idea;
  ideaForm.title = idea.title;
  ideaForm.content = idea.content;
  ideaForm.category = idea.category;
  ideaForm.tags = [...idea.tags];
  ideaForm.is_favorite = idea.is_favorite;
  showCreateDialog.value = true;
};

/**
 * 删除想法
 */
const deleteIdea = async (id: string) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除这个想法吗？此操作不可恢复。',
      '确认删除',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning',
      }
    );
    
    await ideaStore.deleteIdea(id);
  } catch (error) {
    // 用户取消删除
  }
};

/**
 * 重置表单
 */
const resetForm = () => {
  editingIdea.value = null;
  ideaForm.title = '';
  ideaForm.content = '';
  ideaForm.category = '工作';
  ideaForm.tags = [];
  ideaForm.is_favorite = false;
  formRef.value?.resetFields();
};

/**
 * 提交表单
 */
const submitForm = async () => {
  try {
    await formRef.value.validate();
    
    const formData = {
      title: ideaForm.title,
      content: ideaForm.content,
      category: ideaForm.category,
      tags: ideaForm.tags.length > 0 ? ideaForm.tags : undefined,
      is_favorite: ideaForm.is_favorite,
    };
    
    if (editingIdea.value) {
      // 更新
      await ideaStore.updateIdea(editingIdea.value.id!, formData as UpdateIdeaRequest);
    } else {
      // 创建
      await ideaStore.createIdea(formData as CreateIdeaRequest);
    }
    
    showCreateDialog.value = false;
    resetForm();
  } catch (error) {
    console.error('Form validation failed:', error);
  }
};

// 监听搜索关键词变化
watch(searchKeyword, () => {
  ideaStore.setSearchKeyword(searchKeyword.value);
});

// 组件挂载时加载数据
onMounted(async () => {
  await ideaStore.loadIdeas();
  ideaStore.setFilter('all');
});
</script>

<style scoped>
.idea-list-page {
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
  flex-wrap: wrap;
}

.right-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.tag-filter {
  margin-bottom: 24px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  flex-wrap: wrap;
}

.filter-label {
  font-weight: 500;
  color: #606266;
  white-space: nowrap;
  margin-top: 4px;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.idea-container {
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

.idea-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 16px;
}

.idea-card {
  transition: all 0.3s ease;
  cursor: pointer;
}

.idea-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.idea-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.idea-title {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
}

.idea-title h3 {
  margin: 0;
  font-size: 16px;
  color: #303133;
  word-break: break-word;
  flex: 1;
}

.idea-actions {
  display: flex;
  gap: 4px;
}

.idea-content {
  margin-bottom: 12px;
}

.idea-content p {
  margin: 0;
  color: #606266;
  font-size: 14px;
  line-height: 1.6;
  word-break: break-word;
  white-space: pre-wrap;
}

.idea-meta {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
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

.created-date,
.updated-date {
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
  
  .tag-filter {
    flex-direction: column;
    align-items: stretch;
  }
  
  .idea-grid {
    grid-template-columns: 1fr;
  }
}
</style>