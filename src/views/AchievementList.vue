<template>
  <div class="achievement-container">
    <!-- 头部操作栏 -->
    <div class="header-actions">
      <div class="filters">
        <el-select v-model="currentFilter" placeholder="选择过滤器" @change="handleFilterChange">
          <el-option label="全部" value="all" />
          <el-option label="最近30天" value="recent" />
          <el-option label="按标签" value="tagged" />
        </el-select>
        
        <el-select
          v-if="currentFilter === 'tagged'"
          v-model="selectedTags"
          multiple
          placeholder="选择标签"
        >
          <el-option
            v-for="tag in allTags"
            :key="tag"
            :label="tag"
            :value="tag"
          />
        </el-select>
        
        <el-date-picker
          v-model="localDateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
        />
        
        <el-button type="primary" @click="applyFilters">
          <el-icon><Search /></el-icon>
          应用筛选
        </el-button>
        
        <el-button @click="clearFilters">清除筛选</el-button>
      </div>
      
      <el-button type="primary" @click="showCreateDialog = true">
        <el-icon><Plus /></el-icon>
        新增成就日记
      </el-button>
    </div>

    <!-- 统计信息 -->
    <div class="stats">
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-number">{{ totalCount }}</div>
          <div class="stat-label">总记录数</div>
        </div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-number">{{ recentAchievements.length }}</div>
          <div class="stat-label">最近30天</div>
        </div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-number">{{ filteredAchievements.length }}</div>
          <div class="stat-label">当前显示</div>
        </div>
      </el-card>
    </div>

    <!-- 成就日记列表 -->
    <div class="achievement-list" v-loading="loading">
      <div v-if="filteredAchievements.length === 0" class="empty-state">
        <el-empty description="暂无成就日记" />
      </div>
      
      <div v-else class="achievement-grid">
        <el-card
          v-for="achievement in filteredAchievements"
          :key="achievement.id"
          class="achievement-card"
          shadow="hover"
        >
          <template #header>
            <div class="card-header">
              <span class="achievement-title">{{ achievement.title }}</span>
              <div class="card-actions">
                <el-button size="small" @click="editAchievement(achievement)">
                  <el-icon><Edit /></el-icon>
                </el-button>
                <el-button 
                  size="small" 
                  type="danger" 
                  @click="deleteAchievement(achievement.id!)"
                >
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>
            </div>
          </template>
          
          <div class="achievement-content">
            <div class="achievement-date">
              <el-icon><Calendar /></el-icon>
              {{ formatDate(achievement.date) }}
            </div>
            
            <div class="achievement-description">
              {{ achievement.content }}
            </div>
            
            <!-- 图片展示 -->
            <div v-if="achievement.images.length > 0" class="achievement-images">
              <div class="image-grid">
                <div
                  v-for="(image, index) in achievement.images"
                  :key="index"
                  class="image-item"
                >
                  <el-image
                    :src="image"
                    :preview-src-list="achievement.images"
                    :initial-index="index"
                    fit="cover"
                    class="achievement-image"
                  />
                  <div class="image-overlay">
                    <el-button
                      size="small"
                      type="danger"
                      circle
                      @click="deleteImage(achievement.id!, index)"
                    >
                      <el-icon><Delete /></el-icon>
                    </el-button>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- 标签 -->
            <div v-if="achievement.tags.length > 0" class="achievement-tags">
              <el-tag
                v-for="tag in achievement.tags"
                :key="tag"
                size="small"
                class="tag-item"
              >
                {{ tag }}
              </el-tag>
            </div>
            
            <div class="achievement-meta">
              <span class="meta-item">
                创建时间: {{ formatDateTime(achievement.created_at) }}
              </span>
              <span v-if="achievement.updated_at !== achievement.created_at" class="meta-item">
                更新时间: {{ formatDateTime(achievement.updated_at) }}
              </span>
            </div>
          </div>
        </el-card>
      </div>
    </div>

    <!-- 创建/编辑对话框 -->
    <el-dialog
      v-model="showCreateDialog"
      :title="editingAchievement ? '编辑成就日记' : '新增成就日记'"
      width="600px"
      @close="resetForm"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="80px"
      >
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入标题" />
        </el-form-item>
        
        <el-form-item label="日期" prop="date">
          <el-date-picker
            v-model="form.date"
            type="date"
            placeholder="选择日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
        
        <el-form-item label="内容" prop="content">
          <el-input
            v-model="form.content"
            type="textarea"
            :rows="4"
            placeholder="请输入成就内容"
          />
        </el-form-item>
        
        <el-form-item label="图片">
          <div class="upload-section">
            <el-upload
              ref="uploadRef"
              :file-list="fileList"
              :auto-upload="false"
              :on-change="handleFileChange"
              :on-remove="handleFileRemove"
              :before-upload="beforeUpload"
              multiple
              accept="image/*"
              list-type="picture-card"
            >
              <el-icon><Plus /></el-icon>
            </el-upload>
            <div class="upload-tip">
              支持 jpg、png、gif、webp 格式，单个文件不超过 5MB
            </div>
          </div>
        </el-form-item>
        
        <el-form-item label="标签">
          <el-select
            v-model="form.tags"
            multiple
            filterable
            allow-create
            placeholder="选择或创建标签"
            style="width: 100%"
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
        <el-button type="primary" @click="submitForm" :loading="submitting">
          {{ editingAchievement ? '更新' : '创建' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type UploadFile, type UploadFiles } from 'element-plus'
import { Plus, Edit, Delete, Calendar, Search } from '@element-plus/icons-vue'
import { useAchievementStore } from '../stores/achievement'
import type { Achievement, CreateAchievementRequest, UpdateAchievementRequest } from '../types'
import { storeToRefs } from 'pinia';

const achievementStore = useAchievementStore()

// 响应式数据
const showCreateDialog = ref(false)
const editingAchievement = ref<Achievement | null>(null)
const submitting = ref(false)
const formRef = ref<FormInstance>()
const uploadRef = ref()
const fileList = ref<UploadFile[]>([])

// 本地筛选状态
const localDateRange = ref<[string, string] | null>(null)

// 表单数据
const form = reactive({
  title: '',
  content: '',
  date: new Date().toISOString().split('T')[0],
  tags: [] as string[]
})

// 表单验证规则
const rules = {
  title: [
    { required: true, message: '请输入标题', trigger: 'blur' },
    { min: 1, max: 100, message: '标题长度在 1 到 100 个字符', trigger: 'blur' }
  ],
  content: [
    { required: true, message: '请输入内容', trigger: 'blur' },
    { min: 1, max: 2000, message: '内容长度在 1 到 2000 个字符', trigger: 'blur' }
  ],
  date: [
    { required: true, message: '请选择日期', trigger: 'change' }
  ]
}

// 计算属性
const { 
  filteredAchievements, 
  totalCount, 
  recentAchievements, 
  allTags, 
  loading
} = storeToRefs(achievementStore)

const { 
  currentFilter,
  selectedTags,
} = achievementStore

// 方法
const handleFilterChange = (value: string) => {
  achievementStore.setFilter(value as 'all' | 'recent' | 'tagged')
  
  // 如果选择了"全部"或"最近30天"，自动应用筛选
  if (value === 'all' || value === 'recent') {
    applyFilters()
  }
}

/**
 * 应用筛选条件
 */
const applyFilters = () => {
  // 处理标签筛选
  if (currentFilter === 'tagged' && selectedTags.length === 0) {
    achievementStore.setSelectedTags(selectedTags)
  } else if (currentFilter !== 'tagged') {
    // 如果不是按标签筛选，清空已选标签
    achievementStore.setSelectedTags([])
  }
  
  // 处理日期范围筛选
    if (localDateRange.value && localDateRange.value.length === 2) {
    achievementStore.setDateRange({ 
      start: localDateRange.value[0], 
      end: localDateRange.value[1] 
    })
  } else {
    achievementStore.setDateRange(null)
  }
  
  ElMessage.success('筛选条件已应用')
}

/**
 * 清除所有筛选条件
 */
const clearFilters = () => {
  achievementStore.clearFilters()
  localDateRange.value = null
  ElMessage.info('已清除所有筛选条件')
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

const formatDateTime = (dateStr: string) => {
  return new Date(dateStr).toLocaleString('zh-CN')
}

const editAchievement = (achievement: Achievement) => {
  editingAchievement.value = achievement
  form.title = achievement.title
  form.content = achievement.content
  form.date = achievement.date
  form.tags = [...achievement.tags]
  showCreateDialog.value = true
}

const deleteAchievement = async (id: string) => {
  try {
    await ElMessageBox.confirm(
      '此操作将永久删除该成就日记及其图片，是否继续？',
      '警告',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    
    await achievementStore.deleteAchievement(id)
    ElMessage.success('删除成功')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const deleteImage = async (achievementId: string, imageIndex: number) => {
  try {
    await ElMessageBox.confirm(
      '此操作将永久删除该图片，是否继续？',
      '警告',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    
    await achievementStore.deleteAchievementImage(achievementId, imageIndex)
    ElMessage.success('图片删除成功')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('图片删除失败')
    }
  }
}

const handleFileChange = (_file: UploadFile, files: UploadFiles) => {
  fileList.value = files
}

const handleFileRemove = (_file: UploadFile, files: UploadFiles) => {
  fileList.value = files
}

const beforeUpload = (file: File) => {
  const isImage = file.type.startsWith('image/')
  const isLt5M = file.size / 1024 / 1024 < 5

  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
    return false
  }
  if (!isLt5M) {
    ElMessage.error('图片大小不能超过 5MB!')
    return false
  }
  return false // 阻止自动上传
}

const submitForm = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    submitting.value = true
    
    // 获取文件
    const files = fileList.value.map(file => file.raw!).filter(Boolean)
    
    if (editingAchievement.value) {
      // 更新
      const request: UpdateAchievementRequest = {
        title: form.title,
        content: form.content,
        date: form.date,
        tags: form.tags,
        images: files.length > 0 ? files : undefined
      }
      
      await achievementStore.updateAchievement(editingAchievement.value.id!, request)
      ElMessage.success('更新成功')
    } else {
      // 创建
      const request: CreateAchievementRequest = {
        title: form.title,
        content: form.content,
        date: form.date,
        tags: form.tags,
        images: files
      }
      
      await achievementStore.createAchievement(request)
      ElMessage.success('创建成功')
    }
    
    showCreateDialog.value = false
    resetForm()
  } catch (error) {
    ElMessage.error(editingAchievement.value ? '更新失败' : '创建失败')
  } finally {
    submitting.value = false
  }
}

const resetForm = () => {
  editingAchievement.value = null
  form.title = ''
  form.content = ''
  form.date = new Date().toISOString().split('T')[0]
  form.tags = []
  fileList.value = []
  formRef.value?.resetFields()
}

// 生命周期
onMounted(async () => {
  try {
    await achievementStore.fetchAchievements()
    
    // 同步本地筛选状态与store状态
    if (achievementStore.dateRange) {
      localDateRange.value = [achievementStore.dateRange.start, achievementStore.dateRange.end]
    }
  } catch (error) {
    ElMessage.error('获取成就日记失败')
  }
})
</script>

<style scoped>
.achievement-container {
  padding: 20px;
}

.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 10px;
}

.filters {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
  margin-bottom: 16px;
}

.filters .el-select {
  min-width: 120px;
}

.filters .el-date-picker {
  width: auto;
}

.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.stat-card {
  text-align: center;
}

.stat-content {
  padding: 10px;
}

.stat-number {
  font-size: 2em;
  font-weight: bold;
  color: #409eff;
}

.stat-label {
  color: #666;
  margin-top: 5px;
}

.achievement-list {
  min-height: 400px;
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 400px;
}

.achievement-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 20px;
}

.achievement-card {
  height: fit-content;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.achievement-title {
  font-weight: bold;
  font-size: 1.1em;
}

.card-actions {
  display: flex;
  gap: 5px;
}

.achievement-content {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.achievement-date {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #666;
  font-size: 0.9em;
}

.achievement-description {
  line-height: 1.6;
  color: #333;
}

.achievement-images {
  margin: 10px 0;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 10px;
}

.image-item {
  position: relative;
  aspect-ratio: 1;
}

.achievement-image {
  width: 100%;
  height: 100%;
  border-radius: 8px;
}

.image-overlay {
  position: absolute;
  top: 5px;
  right: 5px;
  opacity: 0;
  transition: opacity 0.3s;
}

.image-item:hover .image-overlay {
  opacity: 1;
}

.achievement-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.tag-item {
  margin: 0;
}

.achievement-meta {
  display: flex;
  flex-direction: column;
  gap: 5px;
  font-size: 0.8em;
  color: #999;
}

.meta-item {
  display: block;
}

.upload-section {
  width: 100%;
}

.upload-tip {
  margin-top: 10px;
  font-size: 0.8em;
  color: #666;
}

@media (max-width: 768px) {
  .achievement-grid {
    grid-template-columns: 1fr;
  }
  
  .header-actions {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filters {
    justify-content: center;
  }
}
</style>