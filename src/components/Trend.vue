<template>
  <div class="com-container">
    <div class="title" :style="comStyle">
      <span>{{ '▎ ' + showTitle }}</span>
      <span class="iconfont title-icon" :style="comStyle" @click="showChoice = !showChoice"></span>
      <div class="select-con" v-show="showChoice" :style="marginStyle">
        <div class="select-item" v-for="item in selectTypes" :key="item.key" @click="handleSelect(item.key)">
          {{ item.text }}
        </div>
      </div>
    </div>
    <div class="com-chart" ref="trend_ref"></div>
  </div>
</template>

<script>
import SocketService from '@/utils/socket_service.js';
export default {
  data() {
    return {
      // 修正：变量名拼写错误，从 chartInstane 改为 chartInstance
      chartInstance: null,
      allData: null,
      showChoice: false,
      choiceType: 'map',
      titleFontSize: 0
    }
  },
  created() {
    // 告诉 SocketService：当收到类型为 'trendData' 的消息时，
    // 请调用本组件的 getData 方法来处理。
    SocketService.Instance.registerCallBack('trendData', this.getData);
  },
  // 在 Trend.vue 中
  mounted() {
    this.$nextTick(() => {
      this.initChart();

      // 【核心修正】: 删除或注释掉这一行！
      // 因为 getData 现在是回调函数，不应该在这里被直接调用。
      // this.getData(); 

      // 只保留通过 WebSocket 发送数据请求的逻辑
      SocketService.Instance.send({
        action: 'getData',
        socketType: 'trendData',
        chartName: 'trend'
      });

      window.addEventListener('resize', this.screenAdapter);
      this.screenAdapter();
    });
  },
  // 修正：添加 destroyed 钩子，清理资源
  destroyed() {
    window.removeEventListener('resize', this.screenAdapter);

    // 告诉 SocketService，我这个组件要销毁了，不再需要 trendData 的消息了
    SocketService.Instance.unRegisterCallBack('trendData');

    if (this.chartInstance) {
      this.chartInstance.dispose();
      this.chartInstance = null;
    }
  },
  computed: {
    selectTypes() {
      if (!this.allData) {
        return [];
      } else {
        return this.allData.type.filter(item => {
          return item.key !== this.choiceType;
        });
      }
    },
    showTitle() {
      if (!this.allData) {
        return '';
      } else {
        return this.allData[this.choiceType].title;
      }
    },
    comStyle() {
      return {
        fontSize: this.titleFontSize + 'px'
      };
    },
    marginStyle() {
      return {
        marginLeft: this.titleFontSize + 'px'
      };
    }
  },
  methods: {
    initChart() {
      if (this.chartInstance) {
        this.chartInstance.dispose();
      }
      // chalk 主题现在可以正确应用了
      this.chartInstance = this.$echarts.init(this.$refs.trend_ref, 'chalk');
      const initOption = {
        grid: {
          left: '3%',
          top: '35%',
          right: '4%',
          bottom: '1%',
          containLabel: true
        },
        tooltip: {
          trigger: 'axis'
        },
        legend: {
          left: 20,
          top: '15%',
          icon: 'circle'
        },
        xAxis: {
          type: 'category',
          boundaryGap: false
        },
        yAxis: {
          type: 'value'
        }
      };
      this.chartInstance.setOption(initOption);
    },
    getData(ret) {
      // `ret` 就是 SocketService 传递过来的、从服务器推送的、已经解析好的 JSON 数据
      console.log('Trend.vue 收到推送的数据:', ret); // 添加日志方便调试

      // 【重要】根据您的描述，服务端返回的数据中，真实的图表数据在 .data 字段里
      // 并且可能是一个 JSON 字符串，需要再次解析
      // this.allData = ret.data; // 假设 ret 的结构是 { action: 'getData', data: {...} }
      // 【更新】根据您的描述 `this.callBackMapping[socketType].call(this, JSON.parse(realData))`
      // 这意味着传递给 getData 的 `ret` 已经是被 JSON.parse 过的真实数据了。
      this.allData = ret.data;

      // 拿到数据后，立即更新图表
      this.updateChart();
    },
    updateChart() {
      if (!this.chartInstance) return;

      const colorArr1 = [
        'rgba(11, 168, 44, 0.5)', 'rgba(44, 110, 255, 0.5)',
        'rgba(22, 242, 217, 0.5)', 'rgba(254, 33, 30, 0.5)',
        'rgba(250, 105, 0, 0.5)'
      ];
      const colorArr2 = [
        'rgba(11, 168, 44, 0)', 'rgba(44, 110, 255, 0)',
        'rgba(22, 242, 217, 0)', 'rgba(254, 33, 30, 0)',
        'rgba(250, 105, 0, 0)'
      ];

      const timeArr = this.allData.common.month;
      const valueArr = this.allData[this.choiceType].data;
      const seriesArr = valueArr.map((item, index) => {
        return {
          name: item.name,
          type: 'line',
          data: item.data,
          stack: this.choiceType, // 使用 stack 实现堆叠图效果
          areaStyle: {
            color: new this.$echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: colorArr1[index] },
              { offset: 1, color: colorArr2[index] }
            ])
          }
        }
      });
      const legendArr = valueArr.map(item => item.name);

      const dataOption = {
        xAxis: { data: timeArr },
        legend: { data: legendArr },
        series: seriesArr
      };
      this.chartInstance.setOption(dataOption);
    },
    screenAdapter() {
      if (!this.chartInstance || !this.$refs.trend_ref) return;
      this.titleFontSize = this.$refs.trend_ref.offsetWidth / 100 * 3.6;
      const adapterOption = {
        legend: {
          itemWidth: this.titleFontSize,
          itemHeight: this.titleFontSize,
          itemGap: this.titleFontSize,
          textStyle: {
            fontSize: this.titleFontSize / 1.5 // 调整字体大小比例
          }
        }
      };
      this.chartInstance.setOption(adapterOption);
      this.chartInstance.resize();
    },
    handleSelect(currentType) {
      this.choiceType = currentType;
      this.updateChart();
      this.showChoice = false;
    }
  }
}
</script>

<style lang="less" scoped>
.com-container {
  width: 100%;
  height: 80%;
  position: relative; // 为标题定位提供基准
}

.com-chart {
  width: 100%;
  height: 100%;
}

.title {
  position: absolute;
  left: 20px;
  top: 20px;
  z-index: 10;
  color: white;

  .title-icon {
    margin-left: 10px;
    cursor: pointer;
  }

  .select-con {
    background-color: #222733;
    margin-top: 5px;
  }

  .select-item {
    cursor: pointer;
    padding: 5px 10px;

    &:hover {
      background-color: #4A5164;
    }
  }
}
</style>