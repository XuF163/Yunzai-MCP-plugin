/**
 * 系统监控模块
 * 负责系统信息收集、性能监控等功能
 */
import os from 'node:os';
export declare class SystemMonitor {
    constructor(config: any);
    /**
     * 获取系统信息
     * @returns {Object} 系统信息
     */
    getSystemInfo(): Promise<{
        success: boolean;
        action: string;
        data: {
            platform: NodeJS.Platform;
            arch: NodeJS.Architecture;
            nodeVersion: string;
            hostname: string;
            cpu: {
                model: string;
                cores: number;
                speed: number;
                architecture: string;
            };
            memory: {
                total: number;
                free: number;
                used: number;
                usage: string;
            };
            uptime: {
                system: number;
                process: number;
            };
            network: {};
            user: os.UserInfo<string>;
            loadavg: number[];
            tmpdir: string;
            homedir: string;
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
    getNetworkInterfaces(): {};
    /**
     * 获取系统统计信息
     * @returns {Object} 系统统计
     */
    getSystemStats(): Promise<{
        success: boolean;
        action: string;
        data: {
            process: {
                pid: number;
                ppid: number;
                memory: NodeJS.MemoryUsage;
                cpu: NodeJS.CpuUsage;
                uptime: number;
                version: string;
                versions: NodeJS.ProcessVersions;
            };
            system: {
                platform: NodeJS.Platform;
                arch: NodeJS.Architecture;
                cpus: number;
                memory: {
                    total: number;
                    free: number;
                    used: number;
                };
                uptime: number;
                loadavg: number[];
            };
            env: {
                count: number;
                nodeEnv: string;
                path: number;
            };
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
     * 解析磁盘使用情况（Unix）
     * @param {string} output df 命令输出
     * @returns {Object} 磁盘使用情况
     */
    parseDiskUsage(output: any): {
        error: string;
        filesystem?: undefined;
        size?: undefined;
        used?: undefined;
        available?: undefined;
        usage?: undefined;
        mountpoint?: undefined;
    } | {
        filesystem: any;
        size: any;
        used: any;
        available: any;
        usage: any;
        mountpoint: any;
        error?: undefined;
    };
    /**
     * 解析磁盘使用情况（Windows）
     * @param {string} output wmic 命令输出
     * @returns {Array} 磁盘使用情况
     */
    parseWindowsDiskUsage(output: any): any[];
    /**
     * 获取进程列表
     * @param {Object} data 查询参数
     * @returns {Object} 进程列表
     */
    getProcesses(data?: {}): Promise<{
        success: boolean;
        action: string;
        data: {
            processes: any[];
            total: number;
            limit: any;
            sortBy: any;
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
     * 解析进程列表
     * @param {string} output 命令输出
     * @param {string} platform 平台
     * @returns {Array} 进程列表
     */
    parseProcessList(output: any, platform: any): any[];
    /**
     * 获取内存使用详情
     * @returns {Object} 内存使用详情
     */
    getMemoryInfo(): Promise<{
        success: boolean;
        action: string;
        data: {
            process: {
                rss: number;
                heapTotal: number;
                heapUsed: number;
                external: number;
                arrayBuffers: number;
            };
            system: {
                total: number;
                free: number;
                used: number;
                usage: string;
            };
            formatted: {
                process: {
                    rss: string;
                    heapTotal: string;
                    heapUsed: string;
                    external: string;
                    arrayBuffers: string;
                };
                system: {
                    total: string;
                    free: string;
                    used: string;
                };
            };
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
     * 格式化字节数
     * @param {number} bytes 字节数
     * @returns {string} 格式化后的字符串
     */
    formatBytes(bytes: any): string;
    /**
     * 获取性能指标
     * @returns {Object} 性能指标
     */
    getPerformanceMetrics(): Promise<{
        success: boolean;
        action: string;
        data: {
            cpu: {
                usage: NodeJS.CpuUsage;
                loadavg: number[];
            };
            memory: NodeJS.MemoryUsage;
            performance: {
                executionTime: number;
                eventLoopDelay: Promise<unknown>;
            };
            uptime: {
                process: number;
                system: number;
            };
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
     * 测量事件循环延迟
     * @returns {Promise<number>} 延迟时间（毫秒）
     */
    measureEventLoopDelay(): Promise<unknown>;
}
