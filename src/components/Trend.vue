<template>
    <div class="com-container">
        <div class="com-chart" ref="trend_ref"></div>
    </div>
</template>

<script>
export default {
    name: 'Trend',
    data() {
        return {
            chartInstance: null,
            allData: null
        }
    },
    mounted() {
        this.initChart()
        this.getData()
        window.addEventListener('resize', this.screenAdapter)
        this.screenAdapter()
    },
    destroyed() {
        window.removeEventListener('resize', this.screenAdapter)
    },
    methods: {
        initChart() {
            this.chartInstance = this.$echarts.init(this.$refs.trend_ref)
            const initOption = {}
            this.chartInstance.setOption(initOption)
        },
        async getData() {
            const { data: ret } = await this.$HttpStatusCode.get('trend')
            this.allDate = ret
            this.updateChart()
        },
        updateChart() {
            //处理数据
            const dataOption = {

            }
            this.chartInstance.setOption(dataOption)
        },
        screenAdapter() {
            const adapterOption = {}
            this.cartInstance.setOption(adapterOption)
            this.chartInstance.resize()
        }
    }
}
</script>

<style></style>