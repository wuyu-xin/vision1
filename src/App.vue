<template>
  <div id="app"> <router-link to="/">首页</router-link>
    <router-link to="/TrendPage">折线图</router-link>
    <router-link to="/MapPage">地图</router-link>
    <router-link to="/RankPage">销量柱状图</router-link>
    <router-link to="/HotPage">热销商品</router-link>
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

<style></style>