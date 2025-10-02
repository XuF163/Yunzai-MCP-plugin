/**
 * 时间管理模块
 * 负责时间获取、格式化等功能
 */
export declare class TimeManager {
    constructor(config: any);
    /**
     * 获取当前时间信息
     * @param {Object} data 时间参数
     * @returns {Object} 时间信息
     */
    getTime(data?: {}): Promise<{
        success: boolean;
        action: string;
        data: {
            time: string;
            timestamp: number;
            iso: string;
            timezone: any;
            date: string;
            year: number;
            month: number;
            day: number;
            hour: number;
            minute: number;
            second: number;
            millisecond: number;
            formatted: {
                'HH:mm:ss.SSS': string;
                'YYYY-MM-DD HH:mm:ss.SSS': string;
                'YYYY-MM-DD': string;
                'HH:mm:ss': string;
                'HH:mm': string;
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
     * 格式化时间戳
     * @param {Object} data 格式化参数
     * @returns {Object} 格式化结果
     */
    formatTime(data?: {}): Promise<{
        success: boolean;
        action: string;
        data: {
            formatted: any;
            original: any;
            format: any;
            timezone: any;
            components: {
                year: number;
                month: number;
                day: number;
                hour: number;
                minute: number;
                second: number;
                millisecond: number;
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
     * 获取时间差
     * @param {Object} data 时间差参数
     * @returns {Object} 时间差信息
     */
    getTimeDiff(data?: {}): Promise<{
        success: boolean;
        action: string;
        data: {
            diff: any;
            unit: any;
            start: number;
            end: number;
            formatted: string;
            isNegative: boolean;
            breakdown: {
                milliseconds: number;
                seconds: number;
                minutes: number;
                hours: number;
                days: number;
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
     * 获取时区信息
     * @param {Object} data 时区参数
     * @returns {Object} 时区信息
     */
    getTimezoneInfo(data?: {}): Promise<{
        success: boolean;
        action: string;
        data: {
            current: any;
            offset: number;
            utc: string;
            local: string;
            timezones: {};
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
}
