import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import axios from 'axios'
import './assets/css/global.less'
axios.defaults.baseURL = 'http://localhost:8888/api/'
Vue.prototype.$http = axios

Vue.prototype.$echarts = window.echarts
Vue.config.productionTip = false

new Vue({
    router,
    store,
    render: h => h(App)
}).$mount('#app')