import { createRouter, createWebHistory } from 'vue-router'
import Editor from '../components/Editor.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'editor',
      component: Editor,
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('../views/AboutView.vue'),
    },
    {
      path: '/preview',
      name: 'preview',
      // 懒加载：只有用户访问 /preview 时才加载这个组件，减少首屏体积
      component: () => import('../views/PreviewView.vue'),
    },
  ],
})

export default router
