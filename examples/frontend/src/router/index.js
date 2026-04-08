import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import ANXPage from '../views/ANXPage.vue'

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
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
