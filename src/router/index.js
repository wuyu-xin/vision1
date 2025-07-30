import Vue from 'vue'
import VueRouter from 'vue-router'
import SellerPage from '@/views/SellerPage.vue'

Vue.use(VueRouter)

const routes = [{
    path: '/',
    component: SellerPage
},
{
    path: '/TrendPage',
    component: () => 
        import('@/views/TrendPage.vue')
},
{
    path: '/MapPage',
    component: () => 
        import('@/views/MapPage.vue')
},
{
    path: '/RankPage',
    component: () => 
        import('@/views/RankPage.vue')
},
{
    path: '/HotPage',
    component: () => 
        import('@/views/HotPage.vue')
},
{
    path: '/StockPage',
    component: () => 
        import('@/views/StockPage.vue')
}
]

const router = new VueRouter({
    routes
})

export default router