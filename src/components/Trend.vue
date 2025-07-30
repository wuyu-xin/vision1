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
  mounted() {
    // 优化：使用 $nextTick 确保 DOM 渲染完成
    this.$nextTick(() => {
      this.initChart();
      this.getData();
      window.addEventListener('resize', this.screenAdapter);
      this.screenAdapter();
    });
  },
  // 修正：添加 destroyed 钩子，清理资源
  destroyed() {
    window.removeEventListener('resize', this.screenAdapter);
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
    async getData() {
      try {
        const { data: ret } = await this.$http.get('trend');
        this.allData = ret;
        this.updateChart();
      } catch (e) {
        console.error("趋势数据请求失败：", e);
      }
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