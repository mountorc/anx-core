import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import NodeVisualizationView from '../views/NodeVisualizationView.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/anx/view/:uuid_tile',
    name: 'NodeVisualization',
    component: NodeVisualizationView
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
