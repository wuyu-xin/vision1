<template>
    <div class='com-container'>
        <div class='com-chart' ref='rank_ref'></div>
    </div>
</template>
<script>
// 【第一步】引入 SocketService
import SocketService from '@/utils/socket_service.js';

export default {
    data() {
        return {
            chartInstance: null,
            allData: null,
            startValue: 0,
            endValue: 9,
            timerId: null
        }
    },

    // 【第二步】在 created 中注册回调
    created() {
        SocketService.Instance.registerCallBack('rankData', this.getData);
    },

    mounted() {
        this.initChart();

        // 【第三步】发送获取初始数据的请求
        // 原有的 this.getData() 已被移除
        SocketService.Instance.send({
            action: 'getData',
            socketType: 'rankData', // 业务类型为 rankData
            chartName: 'rank'      // 请求的数据文件为 rank.json
        });

        window.addEventListener('resize', this.screenAdapter);
        this.screenAdapter();
    },

    // 【第四步】在 destroyed 中注销回调
    destroyed() {
        window.removeEventListener('resize', this.screenAdapter);
        clearInterval(this.timerId);
        SocketService.Instance.unRegisterCallBack('rankData');
        if (this.chartInstance) {
            this.chartInstance.dispose();
            this.chartInstance = null;
        }
    },

    methods: {
        initChart() {
            this.chartInstance = this.$echarts.init(this.$refs.rank_ref, 'chalk');
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
            };
            this.chartInstance.setOption(initOption);

            this.chartInstance.on('mouseover', () => {
                clearInterval(this.timerId);
            });
            this.chartInstance.on('mouseout', () => {
                this.startInterval();
            });
        },

        // 【第五步】改造 getData 为回调函数
        getData(ret) {
            console.log('Rank.vue 收到推送的数据:', ret);
            // ret 就是后端推送的、包含在 .data 字段里的真实数据
            this.allData = ret.data;

            if (this.allData) {
                // 【修正】根据您的代码，应该是按 value 排序，而不是 score
                this.allData.sort((a, b) => {
                    return b.value - a.value; // 通常排行是降序，所以用 b.value - a.value
                });
                this.updateChart();
                this.startInterval();
            }
        },

        updateChart() {
            if (!this.allData) return; // 增加健壮性检查

            const provinceData = this.allData.map(item => item.name);
            const valueArr = this.allData.map(item => item.value);
            const colorArr = [
                ['#0BA82C', '#4FF778'], // 绿色
                ['#2E72BF', '#23E5E5'], // 蓝色
                ['#5052EE', '#AB6EE5']  // 紫色
            ];

            const dataOption = {
                xAxis: {
                    data: provinceData,
                },
                dataZoom: [{ // 【修正】dataZoom应为数组
                    show: false,
                    startValue: this.startValue,
                    endValue: this.endValue
                }],
                series: [{
                    data: valueArr,
                    itemStyle: {
                        color: arg => {
                            let targetColorArr;
                            if (arg.value >= 300) {
                                targetColorArr = colorArr[0];
                            } else if (arg.value >= 200) {
                                targetColorArr = colorArr[1];
                            } else {
                                targetColorArr = colorArr[2];
                            }
                            return new this.$echarts.graphic.LinearGradient(0, 0, 0, 1, [ // 【修正】渐变方向通常从下到上(0,1,0,0)或从上到下(0,0,0,1)
                                { offset: 0, color: targetColorArr[0] },
                                { offset: 1, color: targetColorArr[1] }
                            ]);
                        }
                    }
                }]
            };
            this.chartInstance.setOption(dataOption);
        },

        screenAdapter() {
            if (!this.chartInstance || !this.$refs.rank_ref) return;
            const titleFontSize = this.$refs.rank_ref.offsetWidth / 100 * 3.6;
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
                            barBorderRadius: [titleFontSize / 2, titleFontSize / 2, 0, 0] // 修正 barBorderRadius 的值
                        }
                    }
                ]
            };
            this.chartInstance.setOption(adapterOption);
            this.chartInstance.resize();
        },

        startInterval() {
            if (this.timerId) {
                clearInterval(this.timerId);
            }
            if (this.allData && this.allData.length > 10) { // 只有数据多于一页时才轮播
                this.timerId = setInterval(() => {
                    this.startValue++;
                    this.endValue++;
                    if (this.endValue >= this.allData.length) {
                        this.startValue = 0;
                        this.endValue = 9;
                    }
                    // 【重要】更新 dataZoom 需要 setOption
                    this.chartInstance.setOption({
                        dataZoom: [{
                            startValue: this.startValue,
                            endValue: this.endValue
                        }]
                    });
                }, 2000); // 间隔改为2秒
            }
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