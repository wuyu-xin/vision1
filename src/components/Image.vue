<template>
    <div class="energy-dashboard">
        <!-- 页面标题和筛选区 -->
        <div class="dashboard-header">
            <h1 class="dashboard-title">能源消耗数据统计</h1>
            <div class="filter-container">
                <el-form :inline="true" :model="filterForm" class="demo-form-inline">
                    <el-form-item label="时间类型">
                        <el-select v-model="filterForm.timeType" placeholder="请选择时间类型">
                            <el-option label="年" value="year"></el-option>
                            <el-option label="季" value="quarter"></el-option>
                            <el-option label="月" value="month"></el-option>
                            <el-option label="日" value="day"></el-option>
                        </el-select>
                    </el-form-item>

                    <el-form-item label="具体时间">
                        <el-select v-model="filterForm.timeValue" placeholder="请选择具体时间">
                            <el-option v-for="option in timeValueOptions" :key="option.value" :label="option.label"
                                :value="option.value"></el-option>
                        </el-select>
                    </el-form-item>

                    <el-form-item>
                        <el-button type="primary" @click="fetchChartData">
                            <el-icon v-if="loading">
                                <Loading />
                            </el-icon>
                            <span>{{ loading ? '加载中...' : '查询' }}</span>
                        </el-button>
                    </el-form-item>
                </el-form>
            </div>
        </div>

        <!-- 图表区域 -->
        <div class="charts-grid">
            <!-- 水量图表 -->
            <div class="chart-card">
                <div class="card-header">
                    <h3 class="card-title">水量消耗趋势</h3>
                    <div class="card-meta">
                        <span class="value">{{ waterSummary.totalValue }} 吨</span>
                        <span class="trend" :class="{ 'up': waterSummary.trend > 0, 'down': waterSummary.trend < 0 }">
                            <el-icon>
                                <ArrowUpBold />
                            </el-icon>
                            {{ Math.abs(waterSummary.trend) }}%
                        </span>
                    </div>
                </div>
                <div class="chart-container" ref="waterChartRef"></div>
            </div>

            <!-- 电量图表 -->
            <div class="chart-card">
                <div class="card-header">
                    <h3 class="card-title">电量消耗趋势</h3>
                    <div class="card-meta">
                        <span class="value">{{ electricitySummary.totalValue }} 度</span>
                        <span class="trend"
                            :class="{ 'up': electricitySummary.trend > 0, 'down': electricitySummary.trend < 0 }">
                            <el-icon>
                                <ArrowUpBold />
                            </el-icon>
                            {{ Math.abs(electricitySummary.trend) }}%
                        </span>
                    </div>
                </div>
                <div class="chart-container" ref="electricityChartRef"></div>
            </div>

            <!-- 总耗能图表 -->
            <div class="chart-card">
                <div class="card-header">
                    <h3 class="card-title">总耗能趋势</h3>
                    <div class="card-meta">
                        <span class="value">{{ totalEnergySummary.totalValue }} kWh</span>
                        <span class="trend"
                            :class="{ 'up': totalEnergySummary.trend > 0, 'down': totalEnergySummary.trend < 0 }">
                            <el-icon>
                                <ArrowUpBold />
                            </el-icon>
                            {{ Math.abs(totalEnergySummary.trend) }}%
                        </span>
                    </div>
                </div>
                <div class="chart-container" ref="totalEnergyChartRef"></div>
            </div>
        </div>

        <!-- 数据概览卡片 -->
        <div class="stats-cards">
            <el-card class="stats-card" shadow="hover">
                <template #header>
                    <div class="card-header">
                        <span>水量消耗</span>
                    </div>
                </template>
                <div class="card-content">
                    <div class="value">{{ waterSummary.totalValue }} 吨</div>
                    <div class="trend" :class="{ 'up': waterSummary.trend > 0, 'down': waterSummary.trend < 0 }">
                        <el-icon>
                            <ArrowUpBold />
                        </el-icon>
                        {{ Math.abs(waterSummary.trend) }}% 同比 {{ waterSummary.trend > 0 ? '增长' : '下降' }}
                    </div>
                </div>
            </el-card>

            <el-card class="stats-card" shadow="hover">
                <template #header>
                    <div class="card-header">
                        <span>电量消耗</span>
                    </div>
                </template>
                <div class="card-content">
                    <div class="value">{{ electricitySummary.totalValue }} 度</div>
                    <div class="trend"
                        :class="{ 'up': electricitySummary.trend > 0, 'down': electricitySummary.trend < 0 }">
                        <el-icon>
                            <ArrowUpBold />
                        </el-icon>
                        {{ Math.abs(electricitySummary.trend) }}% 同比 {{ electricitySummary.trend > 0 ? '增长' : '下降' }}
                    </div>
                </div>
            </el-card>

            <el-card class="stats-card" shadow="hover">
                <template #header>
                    <div class="card-header">
                        <span>总耗能</span>
                    </div>
                </template>
                <div class="card-content">
                    <div class="value">{{ totalEnergySummary.totalValue }} kWh</div>
                    <div class="trend"
                        :class="{ 'up': totalEnergySummary.trend > 0, 'down': totalEnergySummary.trend < 0 }">
                        <el-icon>
                            <ArrowUpBold />
                        </el-icon>
                        {{ Math.abs(totalEnergySummary.trend) }}% 同比 {{ totalEnergySummary.trend > 0 ? '增长' : '下降' }}
                    </div>
                </div>
            </el-card>
        </div>
    </div>
</template>
<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, watch } from 'vue'
import * as echarts from 'echarts'
import { Loading, ArrowUpBold, ArrowDownBold } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

// 时间筛选表单
const filterForm = reactive({
    timeType: 'month', // 默认选择月
    timeValue: ''
})

// 时间值选项
const timeValueOptions = ref([])

// 图表引用
const waterChartRef = ref(null)
const electricityChartRef = ref(null)
const totalEnergyChartRef = ref(null)

// 图表实例
let waterChart = null
let electricityChart = null
let totalEnergyChart = null

// 加载状态
const loading = ref(false)

// 数据概览
const waterSummary = reactive({
    totalValue: 0,
    trend: 0
})

const electricitySummary = reactive({
    totalValue: 0,
    trend: 0
})

const totalEnergySummary = reactive({
    totalValue: 0,
    trend: 0
})

// 生成时间值选项
const generateTimeValueOptions = () => {
    const options = []
    const currentYear = new Date().getFullYear()

    switch (filterForm.timeType) {
        case 'year':
            // 生成最近5年
            for (let i = currentYear; i >= currentYear - 4; i--) {
                options.push({ label: `${i}年`, value: `${i}` })
            }
            break
        case 'quarter':
            // 生成当前年的4个季度
            for (let i = 1; i <= 4; i++) {
                options.push({ label: `${currentYear}年第${i}季度`, value: `${currentYear}Q${i}` })
            }
            break
        case 'month':
            // 生成当前年的12个月
            for (let i = 1; i <= 12; i++) {
                options.push({ label: `${currentYear}年${i}月`, value: `${currentYear}-${i.toString().padStart(2, '0')}` })
            }
            break
        case 'day':
            // 生成当月的每一天
            // eslint-disable-next-line no-case-declarations
            const currentMonth = new Date().getMonth() + 1
            // eslint-disable-next-line no-case-declarations
            const daysInMonth = new Date(currentYear, currentMonth, 0).getDate()
            for (let i = 1; i <= daysInMonth; i++) {
                options.push({
                    label: `${currentYear}年${currentMonth}月${i}日`,
                    value: `${currentYear}-${currentMonth.toString().padStart(2, '0')}-${i.toString().padStart(2, '0')}`
                })
            }
            break
    }

    timeValueOptions.value = options

    // 如果有选项，设置默认值为第一个
    if (options.length > 0) {
        filterForm.timeValue = options[0].value
    }
}

// 初始化图表
const initCharts = () => {
    // 水量图表
    waterChart = echarts.init(waterChartRef.value)
    waterChart.setOption({
        title: {
            show: false
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'shadow'
            }
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: []
        },
        yAxis: {
            type: 'value',
            name: '水量 (吨)'
        },
        series: [{
            name: '水量',
            type: 'bar',
            data: [],
            itemStyle: {
                color: '#165DFF'
            }
        }]
    })

    // 电量图表
    electricityChart = echarts.init(electricityChartRef.value)
    electricityChart.setOption({
        title: {
            show: false
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'shadow'
            }
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: []
        },
        yAxis: {
            type: 'value',
            name: '电量 (度)'
        },
        series: [{
            name: '电量',
            type: 'bar',
            data: [],
            itemStyle: {
                color: '#FF7D00'
            }
        }]
    })

    // 总耗能图表
    totalEnergyChart = echarts.init(totalEnergyChartRef.value)
    totalEnergyChart.setOption({
        title: {
            show: false
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'shadow'
            }
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: []
        },
        yAxis: {
            type: 'value',
            name: '总耗能 (kWh)'
        },
        series: [{
            name: '总耗能',
            type: 'bar',
            data: [],
            itemStyle: {
                color: '#F53F3F'
            }
        }]
    })

    // 监听窗口大小变化，调整图表
    window.addEventListener('resize', handleWindowResize)
}

// 窗口大小变化处理
const handleWindowResize = () => {
    waterChart?.resize()
    electricityChart?.resize()
    totalEnergyChart?.resize()
}

// 生成模拟数据
const generateMockData = (type, count) => {
    const data = []
    let min, max

    // 根据类型设置数据范围
    switch (type) {
        case 'water':
            min = 50
            max = 200
            break
        case 'electricity':
            min = 100
            max = 500
            break
        case 'total':
            min = 200
            max = 1000
            break
        default:
            min = 10
            max = 100
    }

    // 生成随机数据
    for (let i = 0; i < count; i++) {
        data.push(Math.floor(Math.random() * (max - min + 1)) + min)
    }

    // 计算总计和趋势
    const total = data.reduce((sum, value) => sum + value, 0)
    const trend = Math.floor(Math.random() * 20) - 10 // -10% 到 +10% 之间的随机趋势

    return { data, total, trend }
}

// 获取图表数据
const fetchChartData = async () => {
    if (!filterForm.timeValue) {
        ElMessage.warning('请选择具体时间')
        return
    }

    loading.value = true

    try {
        // 模拟API请求延迟
        await new Promise(resolve => setTimeout(resolve, 800))

        // 确定数据点数量（最多15个）
        let dataCount = 15

        // 根据时间类型生成X轴标签
        let xAxisData = []
        const currentYear = new Date().getFullYear()

        switch (filterForm.timeType) {
            case 'year':
                xAxisData = Array.from({ length: 12 }, (_, i) => `${i + 1}月`)
                dataCount = 12 // 一年12个月
                break
            case 'quarter':
                // eslint-disable-next-line no-case-declarations
                const quarter = parseInt(filterForm.timeValue.split('Q')[1])
                // eslint-disable-next-line no-case-declarations
                const startMonth = (quarter - 1) * 3 + 1
                xAxisData = [
                    `${startMonth}月`,
                    `${startMonth + 1}月`,
                    `${startMonth + 2}月`
                ]
                dataCount = 3 // 一个季度3个月
                break
            case 'month':
                // eslint-disable-next-line no-case-declarations
                const month = parseInt(filterForm.timeValue.split('-')[1])
                // eslint-disable-next-line no-case-declarations
                const daysInMonth = new Date(currentYear, month, 0).getDate()
                dataCount = Math.min(daysInMonth, 15) // 当月天数，最多15天
                xAxisData = Array.from({ length: dataCount }, (_, i) => `${i + 1}日`)
                break
            case 'day':
                dataCount = 15 // 一天显示15个小时
                xAxisData = Array.from({ length: dataCount }, (_, i) => `${i * 2}时`) // 每2小时一个点
                break
        }

        // 生成模拟数据
        const waterData = generateMockData('water', dataCount)
        const electricityData = generateMockData('electricity', dataCount)
        const totalEnergyData = generateMockData('total', dataCount)

        // 更新图表
        waterChart.setOption({
            xAxis: { data: xAxisData },
            series: [{ data: waterData.data }]
        })

        electricityChart.setOption({
            xAxis: { data: xAxisData },
            series: [{ data: electricityData.data }]
        })

        totalEnergyChart.setOption({
            xAxis: { data: xAxisData },
            series: [{ data: totalEnergyData.data }]
        })

        // 更新数据概览
        waterSummary.totalValue = waterData.total.toFixed(1)
        waterSummary.trend = waterData.trend

        electricitySummary.totalValue = electricityData.total.toFixed(1)
        electricitySummary.trend = electricityData.trend

        totalEnergySummary.totalValue = totalEnergyData.total.toFixed(1)
        totalEnergySummary.trend = totalEnergyData.trend
    } catch (error) {
        console.error('获取数据失败:', error)
        ElMessage.error('获取数据失败，请重试')
    } finally {
        loading.value = false
    }
}

// 生命周期钩子
onMounted(() => {
    generateTimeValueOptions()
    initCharts()
    fetchChartData()
})

onUnmounted(() => {
    // 销毁图表实例
    waterChart?.dispose()
    electricityChart?.dispose()
    totalEnergyChart?.dispose()

    // 移除事件监听
    window.removeEventListener('resize', handleWindowResize)

})

// 监听时间类型变化，更新时间值选项
watch(() => filterForm.timeType, () => {
    generateTimeValueOptions()
})
</script>
<style scoped>
.energy-dashboard {
    padding: 24px;
    background-color: #f5f7fa;
    min-height: 100vh;
}

.dashboard-header {
    margin-bottom: 24px;
}

.dashboard-title {
    text-align: center;
    margin-bottom: 16px;
    color: #1f2329;
    font-size: 24px;
    font-weight: 600;
}

.filter-container {
    max-width: 800px;
    margin: 0 auto;
    background-color: #fff;
    border-radius: 8px;
    padding: 16px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.charts-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
    margin-bottom: 24px;
}

.chart-card {
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    height: 400px;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    border-bottom: 1px solid #f2f3f5;
}

.card-title {
    font-size: 16px;
    font-weight: 500;
    color: #1f2329;
}

.card-meta {
    display: flex;
    align-items: center;
    gap: 12px;
}

.value {
    font-size: 18px;
    font-weight: 600;
    color: #1f2329;
}

.trend {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 14px;
}

.trend.up {
    color: #F53F3F;
}

.trend.down {
    color: #00B42A;
}

.trend.down el-icon {
    transform: rotate(180deg);
}

.chart-container {
    flex: 1;
    width: 100%;
    padding: 16px;
}

.stats-cards {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
}

.stats-card {
    height: 120px;
}

.card-content {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.stats-card .value {
    font-size: 24px;
}

.stats-card .trend {
    font-size: 14px;
}

/* 响应式布局 */
@media (max-width: 1200px) {
    .charts-grid {
        grid-template-columns: repeat(2, 1fr);
    }

    .stats-cards {
        grid-template-columns: repeat(2, 1fr);
    }
}

@media (max-width: 768px) {
    .charts-grid {
        grid-template-columns: 1fr;
    }

    .stats-cards {
        grid-template-columns: 1fr;
    }
}
</style>