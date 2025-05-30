/**
 * 用户认证状态管理
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '../lib/supabase'
import type { User, Session } from '@supabase/supabase-js'
import { ElMessage } from 'element-plus'

export const useAuthStore = defineStore('auth', () => {
  // 状态
  const user = ref<User | null>(null)
  const session = ref<Session | null>(null)
  const loading = ref(false)
  const initialized = ref(false)

  // 计算属性
  const isAuthenticated = computed(() => !!user.value)
  const userId = computed(() => user.value?.id || null)

  /**
   * 初始化认证状态
   */
  const initialize = async () => {
    try {
      loading.value = true
      
      // 获取当前会话
      const { data: { session: currentSession } } = await supabase.auth.getSession()
      
      if (currentSession) {
        session.value = currentSession
        user.value = currentSession.user
      }
      
      // 监听认证状态变化
      supabase.auth.onAuthStateChange((event, newSession) => {
        //console.log('Auth state changed:', event, newSession)
        session.value = newSession
        user.value = newSession?.user || null
        
        if (event === 'SIGNED_IN') {
          ElMessage.success('登录成功')
        } else if (event === 'SIGNED_OUT') {
          ElMessage.info('已退出登录')
        }
      })
      
      initialized.value = true
    } catch (error) {
      console.error('Failed to initialize auth:', error)
      ElMessage.error('认证初始化失败')
    } finally {
      loading.value = false
    }
  }

  /**
   * 用户注册
   */
  const signUp = async (email: string, password: string) => {
    try {
      loading.value = true
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })
      
      if (error) {
        throw error
      }
      
      if (data.user && !data.session) {
        ElMessage.success('注册成功！请检查您的邮箱以验证账户')
      } else {
        ElMessage.success('注册成功！')
      }
      
      return { success: true, data }
    } catch (error: any) {
      console.error('Sign up error:', error)
      ElMessage.error(error.message || '注册失败')
      return { success: false, error }
    } finally {
      loading.value = false
    }
  }

  /**
   * 用户登录
   */
  const signIn = async (email: string, password: string) => {
    try {
      loading.value = true
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) {
        throw error
      }
      
      return { success: true, data }
    } catch (error: any) {
      console.error('Sign in error:', error)
      ElMessage.error(error.message || '登录失败')
      return { success: false, error }
    } finally {
      loading.value = false
    }
  }

  /**
   * 用户退出
   */
  const signOut = async () => {
    try {
      loading.value = true
      
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        throw error
      }
      
      // 清除本地状态
      user.value = null
      session.value = null
      
      return { success: true }
    } catch (error: any) {
      console.error('Sign out error:', error)
      ElMessage.error(error.message || '退出失败')
      return { success: false, error }
    } finally {
      loading.value = false
    }
  }

  /**
   * 重置密码
   */
  const resetPassword = async (email: string) => {
    try {
      loading.value = true
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      
      if (error) {
        throw error
      }
      
      ElMessage.success('密码重置邮件已发送，请检查您的邮箱')
      return { success: true }
    } catch (error: any) {
      console.error('Reset password error:', error)
      ElMessage.error(error.message || '密码重置失败')
      return { success: false, error }
    } finally {
      loading.value = false
    }
  }

  return {
    // 状态
    user,
    session,
    loading,
    initialized,
    
    // 计算属性
    isAuthenticated,
    userId,
    
    // 方法
    initialize,
    signUp,
    signIn,
    signOut,
    resetPassword,
  }
})