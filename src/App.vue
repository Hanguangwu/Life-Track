<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from './stores/auth';
import {
  Document,
  Menu as IconMenu,
  Location,
  Calendar,
  Setting,
  Notebook,
  List,
  User,
  SwitchButton,
  Trophy,
} from '@element-plus/icons-vue';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const collapsed = ref(false);

// 计算属性：是否显示认证页面
const showAuthPage = computed(() => {
  return route.path === '/auth';
});

/**
 * 菜单项配置
 */
const menuItems = [
  {
    index: '/dashboard',
    title: '仪表盘',
    icon: Document,
  },
  {
    index: '/todos',
    title: '待办事项',
    icon: List,
  },
  {
    index: '/ideas',
    title: '想法记录',
    icon: Notebook,
  },
  {
    index: '/achievements',
    title: '成就日记',
    icon: Trophy,
  },
  {
    index: '/calendar',
    title: '日历视图',
    icon: Calendar,
  },
  {
    index: '/settings',
    title: '设置',
    icon: Setting,
  },
];

/**
 * 处理菜单选择
 */
const handleMenuSelect = (index: string) => {
  router.push(index);
};

/**
 * 切换侧边栏折叠状态
 */
const toggleCollapse = () => {
  collapsed.value = !collapsed.value;
};

/**
 * 处理用户退出登录
 */
const handleLogout = async () => {
  await authStore.signOut();
  router.push('/auth');
};

onMounted(async () => {
  // 初始化认证状态
  if (!authStore.initialized) {
    await authStore.initialize();
  }
  
  // 路由重定向逻辑
  if (route.path === '/') {
    if (authStore.isAuthenticated) {
      router.push('/dashboard');
    } else {
      router.push('/auth');
    }
  }
});
</script>

<template>
  <div class="app-container">
    <!-- 认证页面 -->
    <div v-if="showAuthPage" class="auth-container">
      <router-view />
    </div>
    
    <!-- 主应用界面 -->
    <template v-else>
      <!-- 侧边栏 -->
      <el-aside :width="collapsed ? '64px' : '200px'" class="sidebar">
        <div class="logo-container">
          <div class="logo">
            <el-icon size="24" color="#409EFF">
              <Location />
            </el-icon>
            <span v-show="!collapsed" class="logo-text">Life Track</span>
          </div>
          <el-button
            :icon="IconMenu"
            circle
            size="small"
            @click="toggleCollapse"
            class="collapse-btn"
          />
        </div>
        
        <el-menu
          :default-active="route.path"
          :collapse="collapsed"
          :unique-opened="true"
          @select="handleMenuSelect"
          class="sidebar-menu"
        >
          <el-menu-item
            v-for="item in menuItems"
            :key="item.index"
            :index="item.index"
          >
            <el-icon>
              <component :is="item.icon" />
            </el-icon>
            <template #title>{{ item.title }}</template>
          </el-menu-item>
        </el-menu>
      </el-aside>

      <!-- 主内容区域 -->
      <el-container class="main-container">
        <!-- 头部 -->
        <el-header class="header">
          <div class="header-content">
            <h2 class="page-title">{{ route.meta?.title || 'Life Track' }}</h2>
            <div class="header-actions">
              <el-dropdown trigger="click">
                <el-button circle>
                  <el-icon><User /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item disabled>
                      <el-icon><User /></el-icon>
                      {{ authStore.user?.email }}
                    </el-dropdown-item>
                    <el-dropdown-item divided @click="handleLogout">
                      <el-icon><SwitchButton /></el-icon>
                      退出登录
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>
        </el-header>

        <!-- 主要内容 -->
        <el-main class="main-content">
          <router-view />
        </el-main>
      </el-container>
    </template>
  </div>
</template>

<style scoped>
.app-container {
  display: flex;
  height: 100vh;
  background-color: #f5f7fa;
}

.auth-container {
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

/* 侧边栏样式 */
.sidebar {
  background-color: #ffffff;
  border-right: 1px solid #e4e7ed;
  transition: width 0.3s ease;
  box-shadow: 2px 0 6px rgba(0, 0, 0, 0.1);
}

.logo-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid #e4e7ed;
  height: 60px;
  box-sizing: border-box;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo-text {
  font-size: 18px;
  font-weight: 600;
  color: #409EFF;
}

.collapse-btn {
  flex-shrink: 0;
}

.sidebar-menu {
  border: none;
  background-color: transparent;
}

.sidebar-menu .el-menu-item {
  margin: 4px 8px;
  border-radius: 6px;
  transition: all 0.3s ease;
}

.sidebar-menu .el-menu-item:hover {
  background-color: #ecf5ff;
  color: #409EFF;
}

.sidebar-menu .el-menu-item.is-active {
  background-color: #409EFF;
  color: #ffffff;
}

.sidebar-menu .el-menu-item.is-active:hover {
  background-color: #337ecc;
}

/* 主容器样式 */
.main-container {
  flex: 1;
  display: flex;
  flex-direction: column;
}

/* 头部样式 */
.header {
  background-color: #ffffff;
  border-bottom: 1px solid #e4e7ed;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 0;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  padding: 0 24px;
}

.page-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

/* 主内容样式 */
.main-content {
  background-color: #f5f7fa;
  padding: 24px;
  overflow-y: auto;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    left: 0;
    top: 0;
    z-index: 1000;
    height: 100vh;
  }
  
  .main-container {
    margin-left: 64px;
  }
}
</style>

<style>
/* 全局样式 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', '微软雅黑', Arial, sans-serif;
  background-color: #f5f7fa;
  color: #303133;
  line-height: 1.6;
}

#app {
  height: 100vh;
  overflow: hidden;
}

/* Element Plus 组件样式覆盖 */
.el-menu {
  border-right: none !important;
}

.el-aside {
  overflow: visible !important;
}

.el-header {
  padding: 0 !important;
}

.el-main {
  padding: 0 !important;
}

/* 滚动条样式 */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 卡片样式 */
.card {
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  padding: 20px;
  margin-bottom: 20px;
}

/* 动画效果 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}

.slide-enter-from {
  transform: translateX(-100%);
}

.slide-leave-to {
  transform: translateX(100%);
}
</style>