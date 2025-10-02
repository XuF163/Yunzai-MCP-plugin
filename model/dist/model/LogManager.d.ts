/**
 * 日志管理模块
 * 负责日志收集、过滤、查询等功能
 */
export declare class LogManager {
    constructor(config: any);
    /**
     * 设置日志捕获
     */
    setupLogCapture(): void;
    /**
     * 设置 logger 捕获
     */
    setupLoggerCapture(): void;
    /**
     * 添加日志条目
     * @param {string} level 日志级别
     * @param {Array} args 日志参数
     */
    addLogEntry(level: any, args: any): void;
    /**
     * 获取日志
     * @param {Object} data 查询参数
     * @returns {Object} 日志数据
     */
    getLogs(data?: {}): Promise<{
        success: boolean;
        action: string;
        data: {
            logs: {
                timestamp: any;
                time: string;
                level: any;
                message: any;
            }[];
            total: any;
            filtered: number;
            parameters: {
                lines: any;
                level: any;
                search: any;
                since: any;
                includeRaw: any;
            };
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
     * 清空日志缓冲区
     * @returns {Object} 清空结果
     */
    clearLogs(): Promise<{
        success: boolean;
        action: string;
        data: {
            clearedCount: any;
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
     * 获取日志统计信息
     * @returns {Object} 统计信息
     */
    getLogStats(): Promise<{
        success: boolean;
        action: string;
        data: {
            stats: {
                total: any;
                byLevel: {};
                recent: {
                    last1min: number;
                    last5min: number;
                    last1hour: number;
                };
            };
            bufferSize: any;
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
     * 设置日志级别过滤
     * @param {Object} data 设置参数
     * @returns {Object} 设置结果
     */
    setLogLevel(data: any): Promise<{
        success: boolean;
        action: string;
        data: {
            level: any;
            validLevels: string[];
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
     * 导出日志
     * @param {Object} data 导出参数
     * @returns {Object} 导出结果
     */
    exportLogs(data?: {}): Promise<{
        success: boolean;
        action: string;
        data: {
            format: any;
            count: number;
            data: any;
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
     * 恢复原始的 console 方法
     */
    restoreConsole(): void;
}
