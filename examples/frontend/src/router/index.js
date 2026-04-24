import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import ANXPage from '../views/ANXPage.vue'
import ANXMarkupPage from '../views/ANXMarkupPage.vue'
import VisitorPagesView from '../views/VisitorPagesView.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/anx/view/:uuid_tile',
    name: 'ANXPage',
    component: ANXPage
  },
  {
    path: '/anx/view',
    name: 'ANXPageUrl',
    component: ANXPage
  },
  {
    path: '/anx/markup/:uuid_tile',
    name: 'ANXMarkupPage',
    component: ANXMarkupPage
  },
  {
    path: '/anx/markup',
    name: 'ANXMarkupPageUrl',
    component: ANXMarkupPage
  },
  {
    path: '/anx/visitor-pages',
    name: 'VisitorPagesView',
    component: VisitorPagesView
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
