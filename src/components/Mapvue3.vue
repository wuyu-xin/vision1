<!-- 商家分布图表 (Vue 3 Composition API 版本) -->
<template>
  <div class="com-container" @dblclick="revertMap">
    <div class="com-chart" ref="map_ref"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick, getCurrentInstance } from 'vue'
import axios from 'axios'
// 假设你的 ECharts 是按需引入或全局挂载的。如果不是，可以在这里引入
// import * as echarts from 'echarts'
import { getProvinceMapInfo } from '@/utils/map_utils.js'

// --- 1. 获取全局实例和定义响应式状态 ---

// 在 <script setup> 中获取全局挂载的属性
const { proxy } = getCurrentInstance()

// ref() 用于创建响应式变量
const chartInstance = ref(null) // ECharts 实例
const allData = ref(null)       // 从后端获取的业务数据
const mapData = ref({})         // 缓存已加载的省份地图数据
const map_ref = ref(null)       // 用于关联模板中的 div 元素


// --- 2. 定义核心方法 ---

/**
 * @description 初始化图表，注册地图并设置基础配置
 */
const initChart = async () => {
  // 初始化 ECharts 实例
  chartInstance.value = proxy.$echarts.init(map_ref.value, 'chalk')

  // 获取并注册中国地图数据
  // 注意：这里的路径是前端静态资源路径，不是后端 API
  try {
    const { data: chinaMapData } = await axios.get('/static/map/china.json')
    proxy.$echarts.registerMap('china', chinaMapData)
  } catch (error) {
    console.error('获取中国地图数据失败:', error)
    return // 如果地图数据加载失败，则不继续执行
  }

  // 设置图表的初始配置项
  const initOption = {
    title: {
      text: '▎ 商家分布',
      left: 20,
      top: 20
    },
    geo: {
      type: 'map',
      map: 'china',
      top: '5%',
      bottom: '5%',
      itemStyle: {
        areaColor: '#2E72BF',
        borderColor: '#333'
      }
    },
    legend: {
      left: '5%',
      bottom: '5%',
      orient: 'vertical'
    }
  }
  chartInstance.value.setOption(initOption)

  // 监听图表的点击事件，用于地图下钻
  chartInstance.value.on('click', async (arg) => {
    const provinceInfo = getProvinceMapInfo(arg.name)
    // 如果点击的区域没有对应的省份信息（如南海诸岛），则不进行任何操作
    if (!provinceInfo) return

    // 懒加载省份地图数据：如果未加载过，则请求并缓存
    if (!mapData.value[provinceInfo.key]) {
      try {
        const { data: provinceMapData } = await axios.get(provinceInfo.path)
        mapData.value[provinceInfo.key] = provinceMapData
        proxy.$echarts.registerMap(provinceInfo.key, provinceMapData)
      } catch (error) {
        console.error(`获取${arg.name}地图数据失败:`, error)
        return
      }
    }
    
    // 切换地图到被点击的省份
    const changeOption = {
      geo: {
        map: provinceInfo.key
      }
    }
    chartInstance.value.setOption(changeOption)
  })
}

/**
 * @description 从服务器获取业务数据
 */
const getData = async () => {
  try {
    const { data: ret } = await proxy.$http.get('map')
    allData.value = ret
    updateChart()
  } catch (error) {
    console.error('获取商家分布数据失败:', error)
  }
}

/**
 * @description 更新图表，将业务数据渲染到地图上
 */
const updateChart = () => {
  if (!allData.value) return // 如果没有数据，则不更新

  const legendArr = allData.value.map(item => item.name)
  const seriesArr = allData.value.map(item => ({
    type: 'effectScatter',
    rippleEffect: {
      scale: 5,
      brushType: 'stroke'
    },
    name: item.name,
    data: item.children,
    coordinateSystem: 'geo'
  }))
  
  const dataOption = {
    legend: {
      data: legendArr
    },
    series: seriesArr
  }
  chartInstance.value.setOption(dataOption)
}

/**
 * @description 屏幕自适应，调整图表尺寸和元素大小
 */
const screenAdapter = () => {
  if (!map_ref.value) return

  const titleFontSize = map_ref.value.offsetWidth / 100 * 3.6
  const adapterOption = {
    title: {
      textStyle: {
        fontSize: titleFontSize
      }
    },
    legend: {
      itemWidth: titleFontSize / 2,
      itemHeight: titleFontSize / 2,
      itemGap: titleFontSize / 2,
      textStyle: {
        fontSize: titleFontSize / 2
      }
    }
  }
  chartInstance.value.setOption(adapterOption)
  chartInstance.value.resize()
}

/**
 * @description 双击地图，返回全国视图
 */
const revertMap = () => {
  const revertOption = {
    geo: {
      map: 'china'
    }
  }
  chartInstance.value.setOption(revertOption)
}


// --- 3. 生命周期钩子 ---

onMounted(async () => {
  await initChart()
  await getData()

  // 使用 nextTick 确保在 DOM 完全渲染后执行第一次自适应
  await nextTick()
  screenAdapter()

  window.addEventListener('resize', screenAdapter)
})

onBeforeUnmount(() => {
  // 组件销毁前，移除事件监听器并销毁图表实例，防止内存泄漏
  window.removeEventListener('resize', screenAdapter)
  if (chartInstance.value) {
    chartInstance.value.dispose()
    chartInstance.value = null
  }
})
</script>

<style lang='less' scoped>
/* 样式部分保持不变 */
.com-container,
.com-chart {
  width: 100%;
  height: 100%;
}
</style>