<template>
  <div class="auth-container">
    <div class="auth-card">
      <div class="auth-header">
        <h1 class="auth-title">{{ isLogin ? '登录' : '注册' }} Life Track</h1>
        <p class="auth-subtitle">{{ isLogin ? '欢迎回来！' : '开始您的生活管理之旅' }}</p>
      </div>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        class="auth-form"
        @submit.prevent="handleSubmit"
      >
        <el-form-item prop="email">
          <el-input
            v-model="form.email"
            type="email"
            placeholder="请输入邮箱地址"
            size="large"
            :prefix-icon="Message"
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            size="large"
            :prefix-icon="Lock"
            show-password
          />
        </el-form-item>

        <el-form-item v-if="!isLogin" prop="confirmPassword">
          <el-input
            v-model="form.confirmPassword"
            type="password"
            placeholder="请确认密码"
            size="large"
            :prefix-icon="Lock"
            show-password
          />
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            size="large"
            class="auth-button"
            :loading="authStore.loading"
            @click="handleSubmit"
          >
            {{ isLogin ? '登录' : '注册' }}
          </el-button>
        </el-form-item>
      </el-form>

      <div class="auth-footer">
        <div class="auth-switch">
          <span>{{ isLogin ? '还没有账户？' : '已有账户？' }}</span>
          <el-button type="text" @click="toggleMode">
            {{ isLogin ? '立即注册' : '立即登录' }}
          </el-button>
        </div>

        <div v-if="isLogin" class="forgot-password">
          <el-button type="text" @click="showResetDialog = true">
            忘记密码？
          </el-button>
        </div>
      </div>
    </div>

    <!-- 重置密码对话框 -->
    <el-dialog
      v-model="showResetDialog"
      title="重置密码"
      width="400px"
      :before-close="handleResetDialogClose"
    >
      <el-form ref="resetFormRef" :model="resetForm" :rules="resetRules">
        <el-form-item prop="email">
          <el-input
            v-model="resetForm.email"
            type="email"
            placeholder="请输入注册邮箱"
            :prefix-icon="Message"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showResetDialog = false">取消</el-button>
          <el-button
            type="primary"
            :loading="authStore.loading"
            @click="handleResetPassword"
          >
            发送重置邮件
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { type FormInstance, type FormRules } from 'element-plus'
import { Message, Lock } from '@element-plus/icons-vue'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

// 表单引用
const formRef = ref<FormInstance>()
const resetFormRef = ref<FormInstance>()

// 状态
const isLogin = ref(true)
const showResetDialog = ref(false)

// 表单数据
const form = reactive({
  email: '',
  password: '',
  confirmPassword: ''
})

const resetForm = reactive({
  email: ''
})

// 表单验证规则
const rules: FormRules = {
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    {
      validator: (_rule, value, callback) => {
        if (value !== form.password) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

const resetRules: FormRules = {
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ]
}

/**
 * 切换登录/注册模式
 */
const toggleMode = () => {
  isLogin.value = !isLogin.value
  // 清空表单
  form.email = ''
  form.password = ''
  form.confirmPassword = ''
  formRef.value?.clearValidate()
}

/**
 * 处理表单提交
 */
const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    const valid = await formRef.value.validate()
    if (!valid) return
    
    let result
    if (isLogin.value) {
      result = await authStore.signIn(form.email, form.password)
    } else {
      result = await authStore.signUp(form.email, form.password)
    }
    
    if (result.success) {
      // 登录成功后跳转到主页
      if (isLogin.value) {
        router.push('/')
      }
    }
  } catch (error) {
    console.error('Auth error:', error)
  }
}

/**
 * 处理重置密码
 */
const handleResetPassword = async () => {
  if (!resetFormRef.value) return
  
  try {
    const valid = await resetFormRef.value.validate()
    if (!valid) return
    
    const result = await authStore.resetPassword(resetForm.email)
    if (result.success) {
      showResetDialog.value = false
      resetForm.email = ''
    }
  } catch (error) {
    console.error('Reset password error:', error)
  }
}

/**
 * 处理重置对话框关闭
 */
const handleResetDialogClose = () => {
  resetForm.email = ''
  resetFormRef.value?.clearValidate()
}
</script>

<style scoped>

.auth-card {
  background: white;
  border-radius: 12px;
  padding: 40px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
}

.auth-header {
  text-align: center;
  margin-bottom: 30px;
}

.auth-title {
  font-size: 28px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 8px 0;
}

.auth-subtitle {
  color: #7f8c8d;
  margin: 0;
  font-size: 14px;
}

.auth-form {
  margin-bottom: 20px;
}

.auth-button {
  width: 100%;
  height: 44px;
  font-size: 16px;
  font-weight: 500;
}

.auth-footer {
  text-align: center;
}

.auth-switch {
  margin-bottom: 10px;
  color: #7f8c8d;
  font-size: 14px;
}

.auth-switch span {
  margin-right: 8px;
}

.forgot-password {
  font-size: 14px;
}

.dialog-footer {
  text-align: right;
}

:deep(.el-input__inner) {
  height: 44px;
}

:deep(.el-form-item) {
  margin-bottom: 20px;
}

:deep(.el-button--text) {
  color: #667eea;
  font-weight: 500;
}

:deep(.el-button--text:hover) {
  color: #5a6fd8;
}
</style>