import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import axios from 'axios'
import './assets/css/global.less'
import socketService from './utils/socket_service'
import SocketService from './utils/socket_service'
socketService.Instance.connect()
axios.defaults.baseURL = 'http://localhost:8888/api/'
Vue.prototype.$http = axios
Vue.prototype.$socket=SocketService.Instance
Vue.prototype.$echarts = window.echarts
Vue.config.productionTip = false

new Vue({
    router,
    store,
    render: h => h(App)
}).$mount('#app')