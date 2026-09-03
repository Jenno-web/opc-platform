import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'landing', component: () => import('@/pages/LandingPage.vue'), meta: { blank: true } },
    { path: '/discover', name: 'discover', component: () => import('@/pages/discover/DiscoverPage.vue') },
    { path: '/discover/:id', name: 'project-detail', component: () => import('@/pages/project/ProjectDetailPage.vue') },
    { path: '/tasks', name: 'tasks', component: () => import('@/pages/tasks/TasksPage.vue') },
    { path: '/publish', name: 'publish', component: () => import('@/pages/publish/PublishPage.vue') },
    { path: '/messages', name: 'messages', component: () => import('@/pages/messages/MessagesPage.vue') },
    { path: '/profile', name: 'profile', component: () => import('@/pages/profile/ProfilePage.vue') },
  ],
})

export default router
