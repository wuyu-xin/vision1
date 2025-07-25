const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
    transpileDependencies: true,

    // 保存时自动进行 ESLint 检查
   lintOnSave: false,

    // 开发服务器配置
    devServer: {
        port: 8999, // 自定义端口（可改成你想要的）
        open: true, // 启动后自动打开浏览器
        host: 'localhost', // 主机地址，可改为 '0.0.0.0' 以支持局域网访问
        proxy: {
            '/api': {
                target: 'http://localhost:3000', // 代理目标地址（根据你的后台服务地址调整）
                changeOrigin: true,
                pathRewrite: {
                    '^/api': ''
                }
            }
        }
    }
})