<template lang="">
    <div class='com-container'>
<div class='com-chart' ref='stock_ref'></div>
</div>
</template>
<script>
export default {
    data() {
        return {
            chartInstance: null,
            allData: null,
            currentIndex: 0,
            timerId: null,
            titleFontSize: 0
        }
    },
    mounted() {
        this.initChart()
        this.getData()
        window.addEventListener('resize', this.screenAdapter)
        this.screenAdapter()
    },
    destroyed() {
        window.removeEventListener('resize', this.screenAdapter),
            clearInterval(this.timerId)
    },
    methods: {
        initChart() {
            this.chartInstance.on('mouseover', () => {
                clearInterval(this.timerId)
            })
            this.chartInstance.on('mouseout', () => {
                this.startInterval()
            })
            const stockRef = this.$refs.stock_ref;
            this.chartInstance = this.$echarts.init(stockRef, 'chalk');
            const initOption = {
                title: {
                    text: '▎ 库存销售量',
                    left: 20,
                    top: 20
                }
            }
            this.chartInstance.setOption(initOption);
        },
        async getData() {
            const { data: ret } = await this.$http.get('stock');
            this.allData = ret;
            this.updateChart();
            this.startInterval()
        },
        startInterval() {
            if (this.timerId) {
                clearInterval(this.timerId)
            }
            this.timerId = setInterval(() => {
                this.currentIndex++
                if (this.currentIndex > 1) {
                    this.currentIndex = 0
                }
                this.updateChart()
            }, 3000)
        },
        updateChart() {
            const start = this.currentIndex * 5
            const end = (this.currentIndex + 1) * 5
            const colorArrs = [
                ['#4FF778', '#0BA82C'],
                ['#E5DD45', '#E8B11C'],
                ['#E8821C', '#E55445'],
                ['#5052EE', '#AB6EE5'],
                ['#23E5E5', '#2E72BF']
            ]
            const centerPoints = [['18%', '40%'],
            ['50%', '40%'],
            ['82%', '40%'],
            ['34%', '75%'],
            ['66%', '75%']]
            const showData = this.allData.slice(0, 5)
            const seriesArr = showData.map((item, index) => {
                return {
                    type: 'pie',
                    radius: ['30%', '50%'],
                    center: centerPoints[index],
                    data: [
                        {
                            name: item.name + '\n\n' + item.sales,
                            value: item.sales,
                            itemStyle: {
                                color: new this.$echarts.graphic.LinearGradient(0, 1, 0, 0,
                                    [
                                        {
                                            offset: 0,
                                            color: colorArrs[index][0]
                                        },
                                        {
                                            offset: 1,
                                            color: colorArrs[index][1]
                                        }
                                    ])
                            }
                        },
                        {
                            value: item.stock,
                            itemStyle: {
                                color: '#333843'
                            }
                        }
                    ],
                    hoverAnimation: false,
                    labelLine: {
                        show: false
                    },
                    label: {
                        show: true,
                        position: 'center',
                        color: colorArrs[index][0]
                    },
                }
            })
            const dataOption = { series: seriesArr }
            this.chartInstance.setOption(dataOption);
        }, screenAdapter() {
            this.titleFontSize = this.$refs.stock_ref.offsetWidth / 100 * 3.6
            const innerRadius = this.titleFontSize * 2
            const outterRadius = innerRadius * 1.125
            const adapterOption = {
                title: {
                    textStyle: {
                        fontSize: this.titleFontSize
                    }
                }, series: [
                    {
                        radius: [outterRadius, innerRadius],
                        label: {
                            fontSize: this.titleFontSize / 2
                        }
                    },
                    {
                        radius: [outterRadius, innerRadius],
                        label: {
                            fontSize: this.titleFontSize / 2
                        }
                    }, {
                        radius: [outterRadius, innerRadius],
                        label: {
                            fontSize: this.titleFontSize / 2
                        }
                    },
                    {
                        radius: [outterRadius, innerRadius],
                        label: {
                            fontSize: this.titleFontSize / 2
                        }
                    },
                    {
                        radius: [outterRadius, innerRadius],
                        label: {
                            fontSize: this.titleFontSize / 2
                        }
                    }
                ]
            }
            this.chartInstance.resize(adapterOption);
            this.chartInstance.resize()
        }
    }
}
</script>
<style lang="">

</style>