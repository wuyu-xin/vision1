<template>
    <div class="screen-container" :style="containerStyle">
        <header class="screen-header">
            <div>
                <img src="/static/img/header_border_dark.png" alt="">
            </div>
            <span class="logo">
                <img src="/static/img/logo_dark.png" alt="" />
            </span>
            <span class="title">电商平台实时监控系统</span>
            <div class="title-right">
                <img src="/static/img/qiehuan_light.png" class="qiehuan" @click="handleChangeTheme">
                <span class="datetime">{{ currentTime }}</span>
            </div>
        </header>
        <div class="screen-body">
            <section class="screen-left">
                <div id="left-top" :class="[fullScreenStatus.trend ? 'fullscreen' : '']">
                    <!-- 销量趋势图表 -->
                    <Trend ref="trend"></Trend>
                    <div class="resize">
                        <!-- icon-compress-alt -->
                        <span @click="changeSize('trend')"
                            :class="['iconfont', fullScreenStatus.trend ? 'icon-compress-alt' : 'icon-expand-alt']"></span>
                    </div>
                </div>
                <div id="left-bottom" :class="[fullScreenStatus.seller ? 'fullscreen' : '']">
                    <!-- 商家销售金额图表 -->
                    <Seller ref="seller"></Seller>
                    <div class="resize">
                        <!-- icon-compress-alt -->
                        <span @click="changeSize('seller')"
                            :class="['iconfont', fullScreenStatus.seller ? 'icon-compress-alt' : 'icon-expand-alt']"></span>
                    </div>
                </div>
            </section>
            <section class="screen-middle">
                <div id="middle-top" :class="[fullScreenStatus.map ? 'fullscreen' : '']">
                    <!-- 商家分布图表 -->
                    <Map ref="map"></Map>
                    <div class="resize">
                        <!-- icon-compress-alt -->
                        <span @click="changeSize('map')"
                            :class="['iconfont', fullScreenStatus.map ? 'icon-compress-alt' : 'icon-expand-alt']"></span>
                    </div>
                </div>
                <div id="middle-bottom" :class="[fullScreenStatus.rank ? 'fullscreen' : '']">
                    <!-- 地区销量排行图表 -->
                    <Rank ref="rank"></Rank>
                    <div class="resize">
                        <!-- icon-compress-alt -->
                        <span @click="changeSize('rank')"
                            :class="['iconfont', fullScreenStatus.rank ? 'icon-compress-alt' : 'icon-expand-alt']"></span>
                    </div>
                </div>
            </section>
            <section class="screen-right">
                <div id="right-top" :class="[fullScreenStatus.hot ? 'fullscreen' : '']">
                    <!-- 热销商品占比图表 -->
                    <Hot ref="hot"></Hot>
                    <div class="resize">
                        <!-- icon-compress-alt -->
                        <span @click="changeSize('hot')"
                            :class="['iconfont', fullScreenStatus.hot ? 'icon-compress-alt' : 'icon-expand-alt']"></span>
                    </div>
                </div>
                <div id="right-bottom" :class="[fullScreenStatus.stock ? 'fullscreen' : '']">
                    <!-- 库存销量分析图表 -->
                    <Stock ref="stock"></Stock>
                    <div class="resize">
                        <!-- icon-compress-alt -->
                        <span @click="changeSize('stock')"
                            :class="['iconfont', fullScreenStatus.stock ? 'icon-compress-alt' : 'icon-expand-alt']"></span>
                    </div>
                </div>
            </section>
        </div>
    </div>
</template>

<script>
import Hot from '@/components/Hot.vue'
import Map from '@/components/Map.vue'
import Rank from '@/components/Rank.vue'
import Seller from '@/components/Seller.vue'
import Stock from '@/components/Stock.vue'
import Trend from '@/components/Trend.vue'
import { mapState } from 'vuex'
import { getThemeValue } from '@/utils/theme_utils'
export default {
    created() {
        // 注册接收到数据的回调函数
        this.$socket.registerCallBack('fullScreen', this.recvData)
        this.$socket.registerCallBack('themeChange', this.recvThemeChange)
    },
    mounted() {
        // 启动时间定时器
        this.startTimeUpdate()
    },
    destroyed() {
        this.$socket.unRegisterCallBack('fullScreen')
        this.$socket.unRegisterCallBack('themeChange')
        // 清除时间定时器
        if (this.timeInterval) {
            clearInterval(this.timeInterval)
        }
    },
    data() {
        return {
            // 定义每一个图表的全屏状态
            fullScreenStatus: {
                trend: false,
                seller: false,
                map: false,
                rank: false,
                hot: false,
                stock: false
            },
            // 当前时间
            currentTime: new Date().toLocaleString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            }).replace(/\//g, '-'),
            timeInterval: null
        }
    },
    methods: {
        changeSize(chartName) {
            // 1.改变fullScreenStatus的数据
            // this.fullScreenStatus[chartName] = !this.fullScreenStatus[chartName]
            // 2.需要调用每一个图表组件的screenAdapter的方法
            // this.$refs[chartName].screenAdapter()
            // this.$nextTick(() => {
            //   this.$refs[chartName].screenAdapter()
            // })
            // 将数据发送给服务端
            const targetValue = !this.fullScreenStatus[chartName]
            this.$socket.send({
                action: 'fullScreen',
                socketType: 'fullScreen',
                chartName: chartName,
                value: targetValue
            })
        },
        // 接收到全屏数据之后的处理
        recvData(data) {
            // 取出是哪一个图表需要进行切换
            const chartName = data.chartName
            // 取出, 切换成什么状态
            const targetValue = data.value
            this.fullScreenStatus[chartName] = targetValue
            this.$nextTick(() => {
                this.$refs[chartName].screenAdapter()
            })
        },
        handleChangeTheme() {
            // 修改VueX中数据
            // this.$store.commit('changeTheme')
            this.$socket.send({
                action: 'themeChange',
                socketType: 'themeChange',
                chartName: '',
                value: ''
            })
        },
        recvThemeChange() {
            this.$store.commit('changeTheme')
        },
        // 启动时间更新定时器
        startTimeUpdate() {
            // 立即更新一次时间
            this.updateTime()
            // 每秒更新时间
            this.timeInterval = setInterval(() => {
                this.updateTime()
            }, 1000)
        },
        // 更新当前时间
        updateTime() {
            this.currentTime = new Date().toLocaleString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            }).replace(/\//g, '-')
        }
    },
    components: {
        Hot,
        Map,
        Rank,
        Seller,
        Stock,
        Trend
    },
    computed: {
        ...mapState(['theme']), // 首先，确保 theme 状态被正确映射进来

        // 创建一个内部计算属性，专门用来安全地获取主题对象
        // 这个属性本身不会被模板使用，但会作为其他计算属性的“安全数据源”
        safeThemeData() {
            // 1. 检查 this.theme 是否是一个有效的字符串
            if (typeof this.theme !== 'string' || !this.theme) {
                return null; // 如果 theme 名称无效，返回 null
            }
            // 2. 调用工具函数获取主题对象
            const themeData = getThemeValue(this.theme);
            // 3. 检查返回的主题对象是否存在
            if (!themeData) {
                console.warn(`未找到名为 "${this.theme}" 的主题配置，请检查 theme_utils.js`);
                return null; // 如果主题对象不存在，返回 null
            }
            return themeData;
        },

        logoSrc() {
            // 使用我们新的安全计算属性
            // 如果 safeThemeData 是 null，则返回一个空字符串或一个默认图片路径
            if (!this.safeThemeData) {
                return ''; // 或者 '/static/img/default-logo.png'
            }
            return '/static/img/' + this.safeThemeData.logoSrc;
        },

        headerSrc() {
            if (!this.safeThemeData) {
                return '';
            }
            return '/static/img/' + this.safeThemeData.headerBorderSrc;
        },

        themeSrc() {
            if (!this.safeThemeData) {
                return '';
            }
            return '/static/img/' + this.safeThemeData.themeSrc;
        },

        containerStyle() {
            // 使用我们新的安全计算属性
            if (!this.safeThemeData) {
                // 如果主题数据还没准备好，返回一个安全的、不报错的空对象
                return {};
            }
            // 只有在数据准备好时，才返回包含样式的对象
            return {
                backgroundColor: this.safeThemeData.backgroundColor,
                color: this.safeThemeData.titleColor
            };
        }
    }
}
</script>
<style lang="less" scoped>
// 全屏样式的定义
.fullscreen {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 100% !important;
    height: 100% !important;
    margin: 0 !important;
    z-index: 100;
}

.screen-container {
    width: 100vw;
    height: 100vh;
    padding: 0 20px;
    background-color: #161522;
    color: #fff;
    box-sizing: border-box;
    overflow: hidden;
}

.screen-header {
    width: 100%;
    height: 64px;
    font-size: 20px;
    position: relative;

    >div {
        img {
            width: 100%;
        }
    }

    .title {
        position: absolute;
        left: 50%;
        top: 50%;
        font-size: 20px;
        transform: translate(-50%, -50%);
    }

    .title-right {
        display: flex;
        align-items: center;
        position: absolute;
        right: 0px;
        top: 50%;
        transform: translateY(-80%);
    }

    .qiehuan {
        width: 28px;
        height: 21px;
        cursor: pointer;
    }

    .datetime {
        font-size: 15px;
        margin-left: 10px;
    }

    .logo {
        position: absolute;
        left: 0px;
        top: 50%;
        transform: translateY(-80%);

        img {
            height: 35px;
            width: 128px;
        }
    }
}

.screen-body {
    width: 100%;
    height: calc(100vh - 80px);
    display: flex;
    margin-top: 10px;

    .screen-left {
        height: 100%;
        width: 31.6%;
        display: flex;
        flex-direction: column;

        #left-top {
            flex: 4;
            position: relative;
            margin-bottom: 15px;
        }

        #left-bottom {
            flex: 6;
            position: relative;
            margin-top: 15px;
        }
    }

    .screen-middle {
        height: 100%;
        width: 35%;
        margin-left: 1.6%;
        margin-right: 1.6%;
        display: flex;
        flex-direction: column;

        #middle-top {
            width: 100%;
            flex: 2;
            position: relative;
            margin-bottom: 15px;
        }

        #middle-bottom {
            width: 100%;
            flex: 1;
            position: relative;
            margin-top: 15px;
        }
    }

    .screen-right {
        height: 100%;
        width: 31.6%;
        display: flex;
        flex-direction: column;

        #right-top {
            flex: 4;
            position: relative;
            margin-bottom: 15px;
        }

        #right-bottom {
            flex: 6;
            position: relative;
            margin-top: 15px;
        }
    }
}

.resize {
    position: absolute;
    right: 20px;
    top: 20px;
    cursor: pointer;
}
</style>
