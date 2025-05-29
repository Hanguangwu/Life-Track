import { createApp } from 'vue';
import { createPinia } from 'pinia';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';
import App from './App.vue';
import router from './router';
import { useAuthStore } from './stores/auth';

/**
 * 创建Vue应用实例
 */
const app = createApp(App);

/**
 * 注册Element Plus图标
 */
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}

/**
 * 安装插件
 */
const pinia = createPinia();
app.use(pinia); // 状态管理
app.use(router); // 路由
app.use(ElementPlus); // UI组件库

/**
 * 全局错误处理
 */
app.config.errorHandler = (err, _instance, info) => {
  console.error('Global error:', err, info);
};

/**
 * 初始化认证状态
 */
const authStore = useAuthStore();
authStore.initialize();

/**
 * 挂载应用
 */
app.mount('#app');

/**
 * 开发环境配置
 */
if (import.meta.env.DEV) {
  console.log('Life Track App started in development mode');
}
