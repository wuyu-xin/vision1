<template lang="">
    <div class='com-container'>
<div class='com-chart' ref='stock_ref'></div>
</div>
</template>
<script>
import SocketService from '@/utils/socket_service.js';

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

    created() {
        SocketService.Instance.registerCallBack('stockData', this.getData);
    },

    mounted() {
        this.initChart();

        SocketService.Instance.send({
            action: 'getData',
            socketType: 'stockData',
            chartName: 'stock'
        });

        window.addEventListener('resize', this.screenAdapter);
        // 【修正】在这里调用一次 screenAdapter，是为了在没有数据时也能初始化图表的【基础尺寸】
        // 但我们需要改造 screenAdapter，让它在没有数据时不执行依赖数据的部分
        this.screenAdapter();
    },

    destroyed() {
        window.removeEventListener('resize', this.screenAdapter);
        clearInterval(this.timerId);
        SocketService.Instance.unRegisterCallBack('stockData');
        if (this.chartInstance) {
            this.chartInstance.dispose();
            this.chartInstance = null;
        }
    },

    methods: {
        initChart() {
            // ... initChart 保持原样 ...
            if (this.chartInstance) {
                this.chartInstance.dispose();
            }
            const stockRef = this.$refs.stock_ref;
            this.chartInstance = this.$echarts.init(stockRef, 'chalk');
            const initOption = {
                title: {
                    text: '▎ 库存和销量分析',
                    left: 20,
                    top: 20
                }
            };
            this.chartInstance.setOption(initOption);

            this.chartInstance.on('mouseover', () => {
                clearInterval(this.timerId);
            });
            this.chartInstance.on('mouseout', () => {
                this.startInterval();
            });
        },

        // 【核心修正】改造 getData 方法
        getData(ret) {
            console.log('Stock.vue 收到推送的数据:', ret);

            // 【重要】之前这里写错了，应该是 ret.data，现在根据你的组件代码保持为 ret
            // 假设你后端返回的 ret 直接就是数据数组
            this.allData = ret.data;

            if (this.allData) {
                // 在收到数据后，才调用 updateChart 和 startInterval
                this.updateChart();
                this.startInterval();
                // 在收到数据后，也调用一次 screenAdapter，确保图表半径等是基于正确数据计算的
                this.screenAdapter();
            }
        },

        startInterval() {
            // ... startInterval 保持原样 ...
            if (this.timerId) {
                clearInterval(this.timerId);
            }
            if (this.allData && this.allData.length > 5) {
                this.timerId = setInterval(() => {
                    this.currentIndex++;
                    if (this.currentIndex * 5 >= this.allData.length) {
                        this.currentIndex = 0;
                    }
                    this.updateChart();
                }, 3000);
            }
        },

        updateChart() {
            // ... updateChart 保持原样 ...
            if (!this.allData) return;

            const start = this.currentIndex * 5;
            const end = (this.currentIndex + 1) * 5;
            const showData = this.allData.slice(start, end);

            const colorArrs = [
                ['#4FF778', '#0BA82C'], ['#E5DD45', '#E8B11C'],
                ['#E8821C', '#E55445'], ['#5052EE', '#AB6EE5'],
                ['#23E5E5', '#2E72BF']
            ];
            const centerPoints = [
                ['18%', '40%'], ['50%', '40%'], ['82%', '40%'],
                ['34%', '75%'], ['66%', '75%']
            ];

            const seriesArr = showData.map((item, index) => {
                return {
                    type: 'pie',
                    radius: ['29%', '35%'],
                    center: centerPoints[index],
                    data: [
                        { name: item.name + '\n\n' + item.sales, value: item.sales, itemStyle: { color: new this.$echarts.graphic.LinearGradient(0, 1, 0, 0, [{ offset: 0, color: colorArrs[index][0] }, { offset: 1, color: colorArrs[index][1] }]) } },
                        { value: item.stock, itemStyle: { color: '#333843' }, tooltip: { formatter: '库存: {c}' } }
                    ],
                    hoverAnimation: false,
                    labelLine: { show: false },
                    label: { show: true, position: 'center', color: colorArrs[index][0], formatter: '{b}' },
                };
            });

            const dataOption = { series: seriesArr };
            this.chartInstance.setOption(dataOption);
        },

        // 【核心修正】改造 screenAdapter 方法
        screenAdapter() {
            if (!this.chartInstance || !this.$refs.stock_ref) return;
            this.titleFontSize = this.$refs.stock_ref.offsetWidth / 100 * 3.6;

            const adapterOption = {
                title: {
                    textStyle: {
                        fontSize: this.titleFontSize
                    }
                }
            };

            // 【增加保护性判断】只有在 allData 存在时，才执行依赖数据的这部分逻辑
            if (this.allData) {
                const seriesAdapters = this.allData.slice(0, 5).map(() => {
                    // 限制圆形图表的最大和最小半径，防止过大或过小
                    const baseFontSize = Math.min(Math.max(this.titleFontSize, 12), 20);
                    const innerRadius = Math.min(baseFontSize * 2.8, 60);
                    const outterRadius = Math.min(innerRadius * 1.15, 80);
                    return {
                        radius: [outterRadius, innerRadius],
                        label: {
                            fontSize: Math.min(this.titleFontSize / 1.5, 14)
                        }
                    };
                });
                adapterOption.series = seriesAdapters;
            }

            this.chartInstance.setOption(adapterOption);
            this.chartInstance.resize();
        }
    }
}
</script>