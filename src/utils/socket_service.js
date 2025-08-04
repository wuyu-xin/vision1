export default class SocketService {
    /**
     * 单例模式
     */
    static instance = null;
    static get Instance() {
        if (!this.instance) {
            this.instance = new SocketService();
        }
        return this.instance;
    }

    ws = null;
    callBackMapping = {}; // 存储回调函数
    connected = false; // 连接状态
    sendRetryCount = 0; // 重试次数

    connect() {
        if (!window.WebSocket) {
            return console.log('您的浏览器不支持 WebSocket!');
        }
        this.ws = new WebSocket('ws://localhost:9998');

        this.ws.onopen = () => {
            console.log('WebSocket 连接成功');
            this.connected = true;
            this.sendRetryCount = 0;
        };

        this.ws.onclose = () => {
            console.log('WebSocket 连接关闭');
            this.connected = false;
            // 可以在这里添加断线重连逻辑
            setTimeout(() => {
            this.connectRetryCount++
            this.connect()
            }, 200 * this.connectRetryCount)
        };

        this.ws.onmessage = msg => {
            console.log('从服务端获取到了数据');
            try {
                const recvData = JSON.parse(msg.data);
                const socketType = recvData.socketType;
                // 如果有注册的回调函数，就调用它
                if (this.callBackMapping[socketType]) {
                    this.callBackMapping[socketType](recvData);
                }
            } catch (error) {
                console.error("解析 JSON 数据失败:", error, msg.data);
            }
        };
    }

    registerCallBack(socketType, callBack) {
        this.callBackMapping[socketType] = callBack;
    }

    unRegisterCallBack(socketType) {
        this.callBackMapping[socketType] = null;
    }

    send(data) {
        if (this.connected) {
            this.ws.send(JSON.stringify(data));
        } else {
            // 添加延迟重试逻辑
            setTimeout(() => {
                this.sendRetryCount++;
                if (this.sendRetryCount < 10) { // 避免无限重试
                    this.send(data);
                }
            }, 500 * this.sendRetryCount);
        }
    }
}