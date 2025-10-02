// @ts-nocheck
/**
 * 网络管理模块
 * 负责网络请求、下载、ping 等网络相关功能
 */
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs/promises';
import path from 'node:path';
const execAsync = promisify(exec);
export class NetworkManager {
    constructor(config) {
        this.config = config;
    }
    /**
     * 检查权限
     * @param {string} permission 权限名称
     */
    checkPermission(permission) {
        if (!this.config?.mcp?.permissions?.[permission]) {
            throw new Error(`权限不足: ${permission}`);
        }
    }
    /**
     * Ping 网络主机
     * @param {Object} data Ping 参数
     * @returns {Object} Ping 结果
     */
    async ping(data) {
        this.checkPermission('allowNetworkAccess');
        const { host, count = 4, timeout = 5000 } = data;
        if (!host) {
            throw new Error('缺少必要参数: host');
        }
        try {
            let command;
            if (process.platform === 'win32') {
                command = `ping -n ${count} -w ${timeout} ${host}`;
            }
            else {
                command = `ping -c ${count} -W ${Math.floor(timeout / 1000)} ${host}`;
            }
            const startTime = Date.now();
            const { stdout, stderr } = await execAsync(command);
            const endTime = Date.now();
            const result = this.parsePingOutput(stdout, process.platform);
            return {
                success: true,
                action: 'network.ping',
                data: {
                    host: host,
                    count: count,
                    timeout: timeout,
                    duration: endTime - startTime,
                    result: result,
                    raw: stdout,
                    timestamp: Date.now()
                },
                timestamp: Date.now(),
                responseTime: endTime - startTime
            };
        }
        catch (error) {
            logger.error('[MCP Handler] Ping 失败:', error);
            return {
                success: false,
                action: 'network.ping',
                error: error.message,
                timestamp: Date.now()
            };
        }
    }
    /**
     * 解析 Ping 输出
     * @param {string} output Ping 命令输出
     * @param {string} platform 平台
     * @returns {Object} 解析结果
     */
    parsePingOutput(output, platform) {
        const result = {
            packets: { sent: 0, received: 0, lost: 0, lossPercent: 0 },
            times: { min: 0, max: 0, avg: 0 },
            success: false
        };
        try {
            if (platform === 'win32') {
                // Windows ping 输出解析
                const lossMatch = output.match(/\((\d+)% loss\)/);
                if (lossMatch) {
                    result.packets.lossPercent = parseInt(lossMatch[1]);
                    result.success = result.packets.lossPercent < 100;
                }
                const timeMatches = output.match(/time[<=](\d+)ms/g);
                if (timeMatches) {
                    const times = timeMatches.map(match => parseInt(match.match(/(\d+)ms/)[1]));
                    result.times.min = Math.min(...times);
                    result.times.max = Math.max(...times);
                    result.times.avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
                    result.packets.received = times.length;
                }
            }
            else {
                // Unix ping 输出解析
                const lossMatch = output.match(/(\d+)% packet loss/);
                if (lossMatch) {
                    result.packets.lossPercent = parseInt(lossMatch[1]);
                    result.success = result.packets.lossPercent < 100;
                }
                const statsMatch = output.match(/(\d+) packets transmitted, (\d+) received/);
                if (statsMatch) {
                    result.packets.sent = parseInt(statsMatch[1]);
                    result.packets.received = parseInt(statsMatch[2]);
                    result.packets.lost = result.packets.sent - result.packets.received;
                }
                const timeMatch = output.match(/min\/avg\/max\/mdev = ([\d.]+)\/([\d.]+)\/([\d.]+)/);
                if (timeMatch) {
                    result.times.min = parseFloat(timeMatch[1]);
                    result.times.avg = parseFloat(timeMatch[2]);
                    result.times.max = parseFloat(timeMatch[3]);
                }
            }
        }
        catch (error) {
            logger.warn('[MCP Handler] 解析 Ping 输出失败:', error);
        }
        return result;
    }
    /**
     * 发送 HTTP 请求
     * @param {Object} data 请求参数
     * @returns {Object} 请求结果
     */
    async request(data) {
        this.checkPermission('allowNetworkAccess');
        const { url, method = 'GET', headers = {}, body, timeout = 10000, followRedirects = true } = data;
        if (!url) {
            throw new Error('缺少必要参数: url');
        }
        try {
            const startTime = Date.now();
            const options = {
                method: method.toUpperCase(),
                headers: {
                    'User-Agent': 'Yunzai-MCP/1.0',
                    ...headers
                }
            };
            if (body && (method.toUpperCase() === 'POST' || method.toUpperCase() === 'PUT')) {
                if (typeof body === 'object') {
                    options.body = JSON.stringify(body);
                    options.headers['Content-Type'] = 'application/json';
                }
                else {
                    options.body = body;
                }
            }
            // 使用 AbortController 实现超时
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);
            options.signal = controller.signal;
            const response = await fetch(url, options);
            clearTimeout(timeoutId);
            const endTime = Date.now();
            const responseTime = endTime - startTime;
            // 读取响应内容
            let responseData;
            const contentType = response.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
                responseData = await response.json();
            }
            else if (contentType.includes('text/')) {
                responseData = await response.text();
            }
            else {
                responseData = `[Binary data: ${response.headers.get('content-length') || 'unknown'} bytes]`;
            }
            return {
                success: true,
                action: 'network.request',
                data: {
                    url: url,
                    method: method,
                    status: response.status,
                    statusText: response.statusText,
                    headers: Object.fromEntries(response.headers.entries()),
                    data: responseData,
                    responseTime: responseTime,
                    timestamp: Date.now()
                },
                timestamp: Date.now(),
                responseTime: responseTime
            };
        }
        catch (error) {
            logger.error('[MCP Handler] HTTP 请求失败:', error);
            return {
                success: false,
                action: 'network.request',
                error: error.message,
                timestamp: Date.now()
            };
        }
    }
    /**
     * 下载文件
     * @param {Object} data 下载参数
     * @returns {Object} 下载结果
     */
    async download(data) {
        this.checkPermission('allowNetworkAccess');
        this.checkPermission('allowFileWrite');
        const { url, savePath, timeout = 30000 } = data;
        if (!url || !savePath) {
            throw new Error('缺少必要参数: url 和 savePath');
        }
        try {
            const startTime = Date.now();
            // 安全检查：确保保存路径在允许的目录内
            const safeDir = path.resolve('data/mcp_client');
            const fullPath = path.resolve(savePath);
            if (!fullPath.startsWith(safeDir)) {
                throw new Error('文件保存路径不在允许的目录内');
            }
            // 确保目录存在
            await fs.mkdir(path.dirname(fullPath), { recursive: true });
            // 使用 AbortController 实现超时
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);
            const response = await fetch(url, {
                signal: controller.signal,
                headers: {
                    'User-Agent': 'Yunzai-MCP/1.0'
                }
            });
            clearTimeout(timeoutId);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const buffer = await response.buffer();
            await fs.writeFile(savePath, buffer);
            const endTime = Date.now();
            const downloadTime = endTime - startTime;
            // 获取文件信息
            const stats = await fs.stat(savePath);
            return {
                success: true,
                action: 'network.download',
                data: {
                    url: url,
                    savePath: savePath,
                    size: stats.size,
                    downloadTime: downloadTime,
                    speed: Math.round(stats.size / (downloadTime / 1000)), // bytes per second
                    timestamp: Date.now()
                },
                timestamp: Date.now(),
                responseTime: downloadTime
            };
        }
        catch (error) {
            logger.error('[MCP Handler] 文件下载失败:', error);
            return {
                success: false,
                action: 'network.download',
                error: error.message,
                timestamp: Date.now()
            };
        }
    }
    /**
     * 检查网络连接状态
     * @returns {Object} 连接状态
     */
    async checkConnectivity() {
        try {
            const testHosts = [
                'www.baidu.com',
                'www.google.com',
                'www.github.com'
            ];
            const results = [];
            for (const host of testHosts) {
                try {
                    const startTime = Date.now();
                    const response = await fetch(`https://${host}`, {
                        method: 'HEAD',
                        signal: AbortSignal.timeout(5000)
                    });
                    const endTime = Date.now();
                    results.push({
                        host: host,
                        status: 'online',
                        responseTime: endTime - startTime,
                        statusCode: response.status
                    });
                }
                catch (error) {
                    results.push({
                        host: host,
                        status: 'offline',
                        error: error.message
                    });
                }
            }
            const onlineCount = results.filter(r => r.status === 'online').length;
            const connectivity = onlineCount > 0 ? 'online' : 'offline';
            return {
                success: true,
                action: 'network.connectivity',
                data: {
                    status: connectivity,
                    onlineHosts: onlineCount,
                    totalHosts: testHosts.length,
                    results: results,
                    timestamp: Date.now()
                },
                timestamp: Date.now(),
                responseTime: 1
            };
        }
        catch (error) {
            logger.error('[MCP Handler] 检查网络连接失败:', error);
            return {
                success: false,
                action: 'network.connectivity',
                error: error.message,
                timestamp: Date.now()
            };
        }
    }
    /**
     * 获取网络接口信息
     * @returns {Object} 网络接口信息
     */
    async getNetworkInterfaces() {
        try {
            const os = await import('node:os');
            const interfaces = os.networkInterfaces();
            const result = {};
            for (const [name, addresses] of Object.entries(interfaces)) {
                result[name] = addresses.map(addr => ({
                    address: addr.address,
                    family: addr.family,
                    internal: addr.internal,
                    mac: addr.mac,
                    netmask: addr.netmask,
                    cidr: addr.cidr
                }));
            }
            return {
                success: true,
                action: 'network.interfaces',
                data: {
                    interfaces: result,
                    count: Object.keys(result).length,
                    timestamp: Date.now()
                },
                timestamp: Date.now(),
                responseTime: 1
            };
        }
        catch (error) {
            logger.error('[MCP Handler] 获取网络接口失败:', error);
            return {
                success: false,
                action: 'network.interfaces',
                error: error.message,
                timestamp: Date.now()
            };
        }
    }
    /**
     * 测试端口连接
     * @param {Object} data 测试参数
     * @returns {Object} 测试结果
     */
    async testPort(data) {
        this.checkPermission('allowNetworkAccess');
        const { host, port, timeout = 5000 } = data;
        if (!host || !port) {
            throw new Error('缺少必要参数: host 和 port');
        }
        try {
            const net = await import('node:net');
            return new Promise((resolve) => {
                const startTime = Date.now();
                const socket = new net.Socket();
                socket.setTimeout(timeout);
                socket.on('connect', () => {
                    const endTime = Date.now();
                    socket.destroy();
                    resolve({
                        success: true,
                        action: 'network.testPort',
                        data: {
                            host: host,
                            port: port,
                            status: 'open',
                            responseTime: endTime - startTime,
                            timestamp: Date.now()
                        },
                        timestamp: Date.now(),
                        responseTime: endTime - startTime
                    });
                });
                socket.on('timeout', () => {
                    socket.destroy();
                    resolve({
                        success: false,
                        action: 'network.testPort',
                        error: 'Connection timeout',
                        data: {
                            host: host,
                            port: port,
                            status: 'timeout',
                            timeout: timeout
                        },
                        timestamp: Date.now()
                    });
                });
                socket.on('error', (error) => {
                    socket.destroy();
                    resolve({
                        success: false,
                        action: 'network.testPort',
                        error: error.message,
                        data: {
                            host: host,
                            port: port,
                            status: 'closed'
                        },
                        timestamp: Date.now()
                    });
                });
                socket.connect(port, host);
            });
        }
        catch (error) {
            logger.error('[MCP Handler] 端口测试失败:', error);
            return {
                success: false,
                action: 'network.testPort',
                error: error.message,
                timestamp: Date.now()
            };
        }
    }
}
// @ts-nocheck
//# sourceMappingURL=NetworkManager.js.map