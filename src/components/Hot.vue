<template>
    <div class='com-container'>
        <div class='com-chart' ref='hot_ref'></div>
        <span class="iconfont arr_left" @click="toLeft" :style="comStyle">&#xe6ef;</span>
        <span class="iconfont arr_right" @click="toRight" :style="comStyle">&#xe6ed;</span>
        <span class="cat_name" :style="comStyle">{{ catTitle }}</span>
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
            currentIndex: 0,
            titleFontSize: 0
        }
    },
    computed: {
        catTitle() {
            if (!this.allData) {
                return '';
            }
            return this.allData[this.currentIndex].name;
        },
        comStyle() {
            return {
                fontSize: this.titleFontSize + 'px'
            };
        }
    },

    // 【第二步】在 created 中注册回调
    created() {
        SocketService.Instance.registerCallBack('hotData', this.getData);
    },

    mounted() {
        this.initChart();

        // 【第三步】发送获取初始数据的请求
        // 原有的 this.getData() 已被移除
        SocketService.Instance.send({
            action: 'getData',
            socketType: 'hotData',    // 业务类型为 hotData
            chartName: 'hotproduct' // 请求的数据文件为 hotproduct.json
        });

        window.addEventListener('resize', this.screenAdapter);
        this.screenAdapter();
    },

    // 【第四步】在 destroyed 中注销回调
    destroyed() {
        window.removeEventListener('resize', this.screenAdapter);
        SocketService.Instance.unRegisterCallBack('hotData');
        if (this.chartInstance) {
            this.chartInstance.dispose();
            this.chartInstance = null;
        }
    },

    methods: {
        toLeft() {
            this.currentIndex--;
            if (this.currentIndex < 0) {
                this.currentIndex = this.allData.length - 1;
            }
            this.updateChart();
        },
        toRight() {
            this.currentIndex++;
            if (this.currentIndex > this.allData.length - 1) {
                this.currentIndex = 0;
            }
            this.updateChart();
        },
        initChart() {
            this.chartInstance = this.$echarts.init(this.$refs.hot_ref, "chalk");
            const initOption = {
                title: {
                    text: '▎ 热销商品销售金额占比统计',
                    left: 20,
                    top: 20 // 调整标题位置
                },
                legend: {
                    top: '15%', // 调整图例位置
                    icon: 'circle'
                },
                tooltip: {
                    trigger: 'item',
                    // 【优化】Tooltip 格式化函数，使其更健壮
                    formatter: (params) => {
                        if (!params.data.children) {
                            return `${params.name}: ${params.value}`;
                        }
                        let tipArray = [];
                        params.data.children.forEach(item => {
                            const percentage = item.value / params.value * 100;
                            // 检查 percentage 是否为有效数字
                            const percentageStr = isNaN(percentage) ? 'N/A' : percentage.toFixed(2) + '%';
                            let childStr = `
                                ${item.name}   
                                ${percentageStr}
                            `;
                            tipArray.push(childStr);
                        });
                        return tipArray.join('<br/>');
                    }
                },
                series: [
                    {
                        type: 'pie',
                        label: { show: false },
                        labelLine: { show: false },
                        emphasis: {
                            label: {
                                show: true,
                                formatter: '{b}\n{d}%' // 高亮时显示名称和百分比
                            }
                        }
                    }
                ]
            };
            this.chartInstance.setOption(initOption);
        },

        // 【第五步】改造 getData 为回调函数
        getData(ret) {
            console.log('Hot.vue 收到推送的数据:', ret);
            // ret 就是后端推送的、包含在 .data 字段里的真实数据
            this.allData = ret.data;
            if (this.allData) {
                this.updateChart();
            }
        },

        updateChart() {
            if (!this.allData) return; // 增加健壮性检查

            // 【健壮性】确保 currentIndex 不会因为数据更新而出错
            if (this.currentIndex >= this.allData.length) {
                this.currentIndex = 0;
            }

            const currentCategory = this.allData[this.currentIndex];
            const seriesData = currentCategory.children.map(item => {
                return {
                    name: item.name,
                    value: item.value,
                    // 【重要】将三级数据也传入，以便 tooltip 使用
                    children: item.children
                };
            });

            const legendData = currentCategory.children.map(item => item.name);

            const dataOption = {
                legend: { data: legendData },
                series: [{ data: seriesData }]
            };
            this.chartInstance.setOption(dataOption);
        },

        screenAdapter() {
            if (!this.chartInstance || !this.$refs.hot_ref) return;
            this.titleFontSize = this.$refs.hot_ref.offsetWidth / 100 * 3.6;
            const adapterOption = {
                title: {
                    textStyle: {
                        fontSize: this.titleFontSize
                    }
                },
                legend: {
                    itemWidth: this.titleFontSize,
                    itemHeight: this.titleFontSize,
                    itemGap: this.titleFontSize / 2,
                    textStyle: {
                        fontSize: this.titleFontSize / 2
                    }
                },
                series: [
                    {
                        radius: this.titleFontSize * 4.5,
                        center: ['50%', '60%'],
                    }
                ]
            };
            this.chartInstance.setOption(adapterOption);
            this.chartInstance.resize();
        }
    }
}
</script>
<style lang="less" scoped>
.com-chart {
    width: 100%;
    height: 100%;
}

.arr_left {
    position: absolute;
    left: 10%;
    top: 50%;
    transform: translateY(-50%);
    cursor: pointer;
    color: white;
}

.arr_right {
    position: absolute;
    right: 10%;
    top: 50%;
    transform: translateY(-50%);
    cursor: pointer;
    color: white;
}

.cat_name {
    position: absolute;
    left: 80%;
    bottom: 20px;
    font-weight: bold;
    color: white;
}
</style>