<template>
    <div class='com-container'>
        <div class='com-chart' ref='hot_ref'><span class="iconfont arr_left">&#xe6ef;</span>
            <span class="iconfont arr_right">&#xe6ed;</span>
        </div>
    </div>
</template>
<script>
export default {
    data() {
        return {
            chartInstance: null,
            allData: null,
            currentIndex: 0
        }
    },
    mounted() {
        this.initChart()
        this.getData()
        window.addEventListener('resize', this.screenAdapter)
        this.screenAdapter()
    },
    destroyed() { window.removeEventListener('resize', this.screenAdapter) },
    methods: {
        initChart() {
            this.chartInstance = this.$echarts.init(this.$refs.hot_ref)
            const initOption = {
                title: {
                    text: '▎ 热销商品销售金额占比统计',
                    left: 20,
                    top: 20
                },
                series: [
                    {
                        type: 'pie'
                    }
                ]
            }
            this.chartInstance.setOption(initOption)
        },
        async getData() {
            const { data: ret } = await this.$http.get('hotproduct')
            this.allData = ret
            this.updateChart()
        },
        updateChart() {
            const seriesData = this.allData[this.currentIndex].children.map(item => {
                return {
                    value: item.value,
                    name: item.name
                }
            })
            // 图例数据
            const legendData = this.allData[this.currentIndex].children.map(item => {
                return item.name
            })
            const dataOption = {
                legend: { data: legendData },
                series: [{ data: seriesData }]
            }
            this.chartInstance.setOption(dataOption)
        },
        screenAdapter() {
            const adapterOption = {}
            this.chartInstance.setOption(adapterOption)
            this.chartInstance.resize()
        }
    }
}
</script>
<style lang="less" scoped>
.com-chart {
    width: 100%;
    height: 100%;
    min-height: 400px;
}

.arr_left {
    position: absolute;
    left: 10%;
    top: 50%;
    transform: translateY(-50%);
    cursor: pointer;
}

.arr_right {
    position: absolute;
    right: 10%;
    top: 50%;
    transform: translateY(-50%);
    cursor: pointer;
}
</style>