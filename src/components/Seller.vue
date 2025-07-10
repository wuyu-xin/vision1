<template>
  <div class="com-container">
    <div class="con-chart" ref="seller_ref">seller</div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      chartInstance: null,
      allData: [],
      currentPage: 1,
      totalPage: 1,
      timeId: null
    }
  },
  mounted() {
    // 等待DOM和布局完全稳定后初始化
    this.$nextTick(() => {
      setTimeout(() => {
        this.initChart()
        this.getData()
        window.addEventListener('resize', this.screenAdapter)
        this.screenAdapter()
      }, 200) // 延迟确保flex布局计算完成
    })
  },
  beforeDestroy() {
    clearInterval(this.timeId)
    window.removeEventListener('resize', this.screenAdapter)
    if (this.chartInstance) {
      this.chartInstance.dispose()
    }
  },
  methods: {
    initChart() {
      // 销毁旧实例避免冲突
      if (this.chartInstance) {
        this.chartInstance.dispose()
      }

      // 获取容器实际尺寸（解决flex布局高度计算问题）
      const container = this.$refs.seller_ref
      const { width, height } = container.getBoundingClientRect()
      console.log('初始化容器尺寸:', `宽:${width}, 高:${height}`)

      // 显式指定初始化尺寸
      this.chartInstance = this.$echarts.init(container, 'chalk', {
        width: width,
        height: height
      })

      // 初始配置
      const initOption = {
        xAxis: {
          type: 'value'
        },
        yAxis: {
          type: 'category',
          data: []
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'line',
            z: 0,
            lineStyle: {
              width: 33,
              color: '#2D3443'
            }
          }
        },
        series: [
          {
            type: 'bar',
            barWidth: 33,
            label: {
              show: true,
              position: 'right',
              textStyle: {
                color: 'white'
              }
            },
            itemStyle: {
              barBorderRadius: [0, 20, 20, 0],
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 1,
                y2: 0,
                colorStops: [
                  { offset: 0, color: '#5052EE' },
                  { offset: 1, color: '#AB6EE5' }
                ]
              }
            },
            data: []
          }
        ]
      }

      this.chartInstance.setOption(initOption)

      // 鼠标事件
      this.chartInstance.on('mouseover', () => {
        clearInterval(this.timeId)
      })
      this.chartInstance.on('mouseout', () => {
        this.startInterval()
      })
    },

    async getData() {
      try {
        const res = await this.$http.get('seller')
        const ret = res.data || []

        if (!Array.isArray(ret)) {
          console.error('接口数据格式错误:', ret)
          return
        }

        // 过滤并排序数据
        this.allData = ret
          .filter(item => item && item.name && typeof item.value === 'number')
          .sort((a, b) => a.value - b.value)

        this.totalPage = Math.max(1, Math.ceil(this.allData.length / 5))
        this.startInterval()
        this.updateCharts()
      } catch (err) {
        console.error('数据请求失败:', err)
      }
    },

    updateCharts() {
      if (!this.chartInstance) return

      // 计算当前页数据
      const showData = this.allData.slice(
        (this.currentPage - 1) * 5,
        this.currentPage * 5
      )
      const sellerNames = showData.map(item => item.name)
      const sellerValues = showData.map(item => item.value)

      // 更新图表数据
      this.chartInstance.setOption({
        yAxis: { data: sellerNames },
        series: [{ data: sellerValues }]
      })
    },

    startInterval() {
      if (this.timeId) clearInterval(this.timeId)

      this.timeId = setInterval(() => {
        this.currentPage = this.currentPage >= this.totalPage ? 1 : this.currentPage + 1
        this.updateCharts()
      }, 2000)
    },

    screenAdapter() {
      if (!this.chartInstance) return

      // 获取最新容器尺寸
      const container = this.$refs.seller_ref
      const { width, height } = container.getBoundingClientRect()
      console.log('适配后尺寸:', `宽:${width}, 高:${height}`)

      // 强制刷新图表尺寸
      this.chartInstance.resize({ width, height })

      // 适配柱子宽度和样式
      const barWidth = Math.min(40, width / 12)
      this.chartInstance.setOption({
        series: [
          {
            barWidth: barWidth,
            itemStyle: {
              barBorderRadius: [0, barWidth / 2, barWidth / 2, 0]
            }
          }
        ],
        tooltip: {
          axisPointer: {
            lineStyle: {
              width: Math.max(20, height / 20)
            }
          }
        }
      })
    }
  }
}
</script>

<style lang="less">
/* 基础样式：确保全屏高度传递 */
html,
body {
  height: 100vh;
  margin: 0;
  padding: 0;
  overflow: hidden;
  /* 禁止页面滚动 */
}

/* 父容器：全屏高度，flex布局 */
.com-container {
  height: 100vh;
  width: 100%;
  display: flex;
  /* 如需水平居中图表，可保留下面一行 */
  /* justify-content: center; */
}

/* 图表容器：继承父容器高度，确保100%生效 */
.con-chart {
  height: 100%;
  width: 100%;
  min-height: 300px;
  /* 最小高度，避免内容过少时异常 */
  box-sizing: border-box;
  /* 避免边框影响尺寸计算 */
}
</style>
