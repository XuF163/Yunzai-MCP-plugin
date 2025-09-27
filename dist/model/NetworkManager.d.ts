/**
 * 网络管理模块
 * 负责网络请求、下载、ping 等网络相关功能
 */
export declare class NetworkManager {
    constructor(config: any);
    /**
     * 检查权限
     * @param {string} permission 权限名称
     */
    checkPermission(permission: any): void;
    /**
     * Ping 网络主机
     * @param {Object} data Ping 参数
     * @returns {Object} Ping 结果
     */
    ping(data: any): Promise<{
        success: boolean;
        action: string;
        data: {
            host: any;
            count: any;
            timeout: any;
            duration: number;
            result: {
                packets: {
                    sent: number;
                    received: number;
                    lost: number;
                    lossPercent: number;
                };
                times: {
                    min: number;
                    max: number;
                    avg: number;
                };
                success: boolean;
            };
            raw: string;
            timestamp: number;
        };
        timestamp: number;
        responseTime: number;
        error?: undefined;
    } | {
        success: boolean;
        action: string;
        error: any;
        timestamp: number;
        data?: undefined;
        responseTime?: undefined;
    }>;
    /**
     * 解析 Ping 输出
     * @param {string} output Ping 命令输出
     * @param {string} platform 平台
     * @returns {Object} 解析结果
     */
    parsePingOutput(output: any, platform: any): {
        packets: {
            sent: number;
            received: number;
            lost: number;
            lossPercent: number;
        };
        times: {
            min: number;
            max: number;
            avg: number;
        };
        success: boolean;
    };
    /**
     * 发送 HTTP 请求
     * @param {Object} data 请求参数
     * @returns {Object} 请求结果
     */
    request(data: any): Promise<{
        success: boolean;
        action: string;
        data: {
            url: any;
            method: any;
            status: number;
            statusText: string;
            headers: {
                [k: string]: string;
            };
            data: any;
            responseTime: number;
            timestamp: number;
        };
        timestamp: number;
        responseTime: number;
        error?: undefined;
    } | {
        success: boolean;
        action: string;
        error: any;
        timestamp: number;
        data?: undefined;
        responseTime?: undefined;
    }>;
    /**
     * 下载文件
     * @param {Object} data 下载参数
     * @returns {Object} 下载结果
     */
    download(data: any): Promise<{
        success: boolean;
        action: string;
        data: {
            url: any;
            savePath: any;
            size: number;
            downloadTime: number;
            speed: number;
            timestamp: number;
        };
        timestamp: number;
        responseTime: number;
        error?: undefined;
    } | {
        success: boolean;
        action: string;
        error: any;
        timestamp: number;
        data?: undefined;
        responseTime?: undefined;
    }>;
    /**
     * 检查网络连接状态
     * @returns {Object} 连接状态
     */
    checkConnectivity(): Promise<{
        success: boolean;
        action: string;
        data: {
            status: string;
            onlineHosts: number;
            totalHosts: number;
            results: any[];
            timestamp: number;
        };
        timestamp: number;
        responseTime: number;
        error?: undefined;
    } | {
        success: boolean;
        action: string;
        error: any;
        timestamp: number;
        data?: undefined;
        responseTime?: undefined;
    }>;
    /**
     * 获取网络接口信息
     * @returns {Object} 网络接口信息
     */
    getNetworkInterfaces(): Promise<{
        success: boolean;
        action: string;
        data: {
            interfaces: {};
            count: number;
            timestamp: number;
        };
        timestamp: number;
        responseTime: number;
        error?: undefined;
    } | {
        success: boolean;
        action: string;
        error: any;
        timestamp: number;
        data?: undefined;
        responseTime?: undefined;
    }>;
    /**
     * 测试端口连接
     * @param {Object} data 测试参数
     * @returns {Object} 测试结果
     */
    testPort(data: any): Promise<unknown>;
}
