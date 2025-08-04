<!-- 商家分布图表 -->
<template>
  <div class='com-container' @dblclick="revertMap">
    <div class='com-chart' ref='map_ref'></div>
  </div>
</template>

<script>
import axios from 'axios';
import { getProvinceMapInfo } from '@/utils/map_utils.js';
// 【第一步】引入 SocketService
import SocketService from '@/utils/socket_service.js';

export default {
  data() {
    return {
      chartInstance: null,
      allData: null,
      mapData: {} // 所获取的省份的地图矢量数据
    }
  },

  // 【第二步】在 created 中注册回调
  created() {
    SocketService.Instance.registerCallBack('mapData', this.getData);
  },

  mounted() {
    this.initChart();

    // 【第三步】发送获取初始数据的请求
    // 原有的 this.getData() 已被移除
    SocketService.Instance.send({
      action: 'getData',
      socketType: 'mapData', // 业务类型为 mapData
      chartName: 'map'       // 请求的数据文件为 map.json
    });

    window.addEventListener('resize', this.screenAdapter);
    this.screenAdapter();
  },

  // 【第四步】在 destroyed 中注销回调
  destroyed() {
    window.removeEventListener('resize', this.screenAdapter);
    SocketService.Instance.unRegisterCallBack('mapData');
    if (this.chartInstance) {
      this.chartInstance.dispose();
      this.chartInstance = null;
    }
  },

  methods: {
    // initChart 保持 async，因为它需要异步加载地图 JSON
    async initChart() {
      this.chartInstance = this.$echarts.init(this.$refs.map_ref, 'chalk');

      // 【保持不变】获取中国地图的矢量数据逻辑
      // 这部分与 WebSocket 无关，是组件的初始化要求
      try {
        const ret = await axios.get('http://localhost:8999/static/map/china.json');
        this.$echarts.registerMap('china', ret.data);
      } catch (error) {
        console.error("加载中国地图文件失败:", error);
        // 可以在这里添加一些用户提示，例如显示“地图加载失败”
        return;
      }

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
      };
      this.chartInstance.setOption(initOption);

      // 【保持不变】地图点击下钻的逻辑
      this.chartInstance.on('click', async arg => {
        const provinceInfo = getProvinceMapInfo(arg.name);
        if (!provinceInfo) return; // 如果点击的是南海诸岛等，直接返回

        if (!this.mapData[provinceInfo.key]) {
          try {
            const ret = await axios.get('http://localhost:8999' + provinceInfo.path);
            this.mapData[provinceInfo.key] = ret.data;
            this.$echarts.registerMap(provinceInfo.key, ret.data);
          } catch (error) {
            console.error(`加载省份地图 ${provinceInfo.key} 失败:`, error);
            return;
          }
        }
        const changeOption = {
          geo: {
            map: provinceInfo.key
          }
        };
        this.chartInstance.setOption(changeOption);
      });
    },

    // 【第五步】改造 getData 为回调函数
    // 不再需要 async 和 this.$http.get
    getData(ret) {
      // ret 就是从 WebSocket 推送过来的商家散点数据
      console.log('Map.vue 收到推送的数据:', ret);
      this.allData = ret.data;
      this.updateChart();
    },

    updateChart() {
      if (!this.allData) return; // 增加健壮性检查

      const legendArr = this.allData.map(item => item.name);
      const seriesArr = this.allData.map(item => {
        return {
          type: 'effectScatter',
          rippleEffect: {
            scale: 5,
            brushType: 'stroke'
          },
          name: item.name,
          data: item.children,
          coordinateSystem: 'geo'
        };
      });
      const dataOption = {
        legend: {
          data: legendArr
        },
        series: seriesArr
      };
      this.chartInstance.setOption(dataOption);
    },

    screenAdapter() {
      if (!this.chartInstance || !this.$refs.map_ref) return;
      const titleFontSize = this.$refs.map_ref.offsetWidth / 100 * 3.6;
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
      };
      this.chartInstance.setOption(adapterOption);
      this.chartInstance.resize();
    },

    revertMap() {
      const revertOption = {
        geo: {
          map: 'china'
        }
      };
      this.chartInstance.setOption(revertOption);
    }
  }
}
</script>
<style lang='less' scoped>
.com-page {
  width: 100%;
  height: 100vh;
  /* vh 是视口高度单位，100vh 代表整个屏幕的高度 */
}

.com-container {
  width: 100%;
  height: 100%;
}

.com-chart {
  width: 100%;
  height: 100%;
}
</style>
