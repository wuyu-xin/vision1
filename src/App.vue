<template>
  <div id="app">
    <!-- 只在非大屏页面显示导航 -->
    <nav v-if="$route.path !== '/'" class="navigation">
      <router-link to="/">首页</router-link>
      <router-link to="/TrendPage">折线图</router-link>
      <router-link to="/MapPage">地图</router-link>
      <router-link to="/RankPage">销量柱状图</router-link>
      <router-link to="/HotPage">热销商品</router-link>
      <router-link to="/StockPage">库存销量</router-link>
    </nav>
    <router-view></router-view>
  </div>
</template>

<script>

export default {
  data() {
    return {}
  }, methods: {}
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  width: 100%;
  height: 100vh;
  margin: 0;
  padding: 0;
}

.navigation {
  background: #333;
  padding: 10px;
  text-align: center;
}

.navigation router-link {
  color: #fff;
  text-decoration: none;
  margin: 0 15px;
  padding: 5px 10px;
  border-radius: 4px;
  transition: background 0.3s;
}

.navigation router-link:hover,
.navigation router-link.router-link-active {
  background: #555;
}


</style>