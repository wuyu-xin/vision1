<template>
    <div class='com-container'>
        <div class='com-chart' ref='rank_ref'></div>
    </div>
</template>
<script>
export default {
    data() {
        return {
            chartInstance: null,
            allData: null,
            startValue: 0,
            endValue: 9,
            timerId: null
        }
    }, mounted() {
        this.initChart()
        this.getData()
        window.addEventListener('resize', this.screenAdapter)
        this.screenAdapter()
    }, destroyed() {
        window.removeEventListener('resize', this.screenAdapter)
        clearInterval(this.timerId)
    },
    methods: {
        initChart() {
            this.chartInstance = this.$echarts.init(this.$refs.rank_ref, 'chalk')
            const initOption = {
                title: {
                    text: '▎ 地区销售排行',
                    left: 20,
                    top: 20
                },
                grid: {
                    top: '40%',
                    left: '5%',
                    bottom: '5%',
                    right: '5%',
                    containLabel: true
                },
                tooltip: {
                    show: true
                },
                xAxis: {
                    type: 'category',
                },
                yAxis: {
                    type: 'value',
                    name: '销售金额（万）',

                },
                series: [{
                    type: 'bar',
                }],
            }
            this.chartInstance.setOption(initOption)
            this.chartInstance.on('mouseover', () => {
                clearInterval(this.timerId)
            })
            this.chartInstance.on('mouseout', () => {
                this.startInterval()
            })
        },
        async getData() {
            const { data: ret } = await this.$http.get('rank')
            console.log(ret)
            this.allData = ret
            this.allData.sort((a, b) => {
                return a.score - b.score
            })
            this.updateChart()
            this.startInterval()
        },
        updateChart() {
            const provinceData = this.allData.map(item => {
                return item.name
            })
            const valueArr = this.allData.map(item => {
                return item.value
            })
            const colorArr = [
                ['#0BA82C', '#4FF778'],
                ['#2E72BF', '#23E5E5'],
                ['#5052EE', '#AB6EE5']
            ]
            const dataOption = {
                xAxis: {
                    data: provinceData,
                },
                dataZoom: {
                    show: false,
                    startValue: this.startValue,
                    endValue: this.endValue
                },
                series: [{
                    data: valueArr,
                    itemStyle: {
                        color: arg => {
                            let targetColorArr = colorArr[0]
                            if (arg.value >= 300) {
                                targetColorArr = colorArr[0]
                            } else if (arg.value >= 200) {
                                targetColorArr = colorArr[1]
                            } else {
                                targetColorArr = colorArr[2]
                            }
                            return new this.$echarts.graphic.LinearGradient(0,
                                1, 0, 0, [
                                {
                                    offset: 0,
                                    color: targetColorArr[0]
                                },
                                {
                                    offset: 1,
                                    color: targetColorArr[1]
                                }
                            ])
                        }
                    }
                }
                ]
            }
            this.chartInstance.setOption(dataOption)
        },
        screenAdapter() {
            const titleFontSize = this.$refs.rank_ref.offsetWidth / 100 * 3.6
            const adapterOption = {
                title: {
                    textStyle: {
                        fontSize: titleFontSize
                    }
                },
                series: [
                    {
                        barWidth: titleFontSize,
                        itemStyle: {
                            barBorderRadius: [0.5 * titleFontSize, 0.5 *
                                titleFontSize, 0, 0]
                        }
                    }
                ]
            }
            this.chartInstance.setOption(adapterOption)
            this.chartInstance.resize()
        },
        startInterval() {
            if (this.timerId) {
                clearInterval(this.timerId)
            }
            this.timerId = setInterval(() => {
                this.startValue += 1
                this.endValue += 1
                if (this.endValue >= this.allData.length) {
                    this.startValue = 0
                    this.endValue = 9
                }
                this.updateChart()
            }, 3000)
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
</style>