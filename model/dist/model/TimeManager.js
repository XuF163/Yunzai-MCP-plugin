// @ts-nocheck
/**
 * 时间管理模块
 * 负责时间获取、格式化等功能
 */
export class TimeManager {
    constructor(config) {
        this.config = config;
    }
    /**
     * 获取当前时间信息
     * @param {Object} data 时间参数
     * @returns {Object} 时间信息
     */
    async getTime(data = {}) {
        try {
            const { timezone = 'Asia/Shanghai' } = data;
            // 获取当前时间戳
            const now = new Date();
            const timestamp = now.getTime();
            // 设置时区
            const timeInTimezone = new Date(now.toLocaleString("en-US", { timeZone: timezone }));
            // 提取时间组件
            const year = timeInTimezone.getFullYear();
            const month = timeInTimezone.getMonth() + 1;
            const day = timeInTimezone.getDate();
            const hour = timeInTimezone.getHours();
            const minute = timeInTimezone.getMinutes();
            const second = timeInTimezone.getSeconds();
            const millisecond = timeInTimezone.getMilliseconds();
            // 格式化函数
            const pad = (num, length = 2) => String(num).padStart(length, '0');
            // 主要返回值：精确到毫秒的时间格式
            const mainTime = `${pad(hour)}:${pad(minute)}:${pad(second)}.${pad(millisecond, 3)}`;
            // 多种格式化选项
            const formatted = {
                'HH:mm:ss.SSS': mainTime,
                'YYYY-MM-DD HH:mm:ss.SSS': `${year}-${pad(month)}-${pad(day)} ${mainTime}`,
                'YYYY-MM-DD': `${year}-${pad(month)}-${pad(day)}`,
                'HH:mm:ss': `${pad(hour)}:${pad(minute)}:${pad(second)}`,
                'HH:mm': `${pad(hour)}:${pad(minute)}`
            };
            return {
                success: true,
                action: 'time.get',
                data: {
                    // 主要返回值
                    time: mainTime,
                    // 基础信息
                    timestamp: timestamp,
                    iso: now.toISOString(),
                    timezone: timezone,
                    date: `${year}/${month}/${day}`,
                    // 时间组件
                    year: year,
                    month: month,
                    day: day,
                    hour: hour,
                    minute: minute,
                    second: second,
                    millisecond: Math.floor(millisecond / 100) * 100, // 精确到百毫秒
                    // 格式化选项
                    formatted: formatted
                },
                timestamp: timestamp,
                responseTime: 1
            };
        }
        catch (error) {
            logger.error('[MCP Handler] 获取时间失败:', error);
            return {
                success: false,
                action: 'time.get',
                error: error.message,
                timestamp: Date.now()
            };
        }
    }
    /**
     * 格式化时间戳
     * @param {Object} data 格式化参数
     * @returns {Object} 格式化结果
     */
    async formatTime(data = {}) {
        try {
            const { timestamp = Date.now(), format = 'YYYY-MM-DD HH:mm:ss', timezone = 'Asia/Shanghai' } = data;
            // 创建日期对象
            const date = new Date(timestamp);
            // 设置时区
            const timeInTimezone = new Date(date.toLocaleString("en-US", { timeZone: timezone }));
            // 提取时间组件
            const year = timeInTimezone.getFullYear();
            const month = timeInTimezone.getMonth() + 1;
            const day = timeInTimezone.getDate();
            const hour = timeInTimezone.getHours();
            const minute = timeInTimezone.getMinutes();
            const second = timeInTimezone.getSeconds();
            const millisecond = timeInTimezone.getMilliseconds();
            // 格式化函数
            const pad = (num, length = 2) => String(num).padStart(length, '0');
            // 替换格式字符串
            let formattedTime = format
                .replace(/YYYY/g, year)
                .replace(/MM/g, pad(month))
                .replace(/DD/g, pad(day))
                .replace(/HH/g, pad(hour))
                .replace(/mm/g, pad(minute))
                .replace(/ss/g, pad(second))
                .replace(/SSS/g, pad(millisecond, 3));
            return {
                success: true,
                action: 'time.format',
                data: {
                    formatted: formattedTime,
                    original: timestamp,
                    format: format,
                    timezone: timezone,
                    components: {
                        year: year,
                        month: month,
                        day: day,
                        hour: hour,
                        minute: minute,
                        second: second,
                        millisecond: millisecond
                    }
                },
                timestamp: Date.now(),
                responseTime: 1
            };
        }
        catch (error) {
            logger.error('[MCP Handler] 格式化时间失败:', error);
            return {
                success: false,
                action: 'time.format',
                error: error.message,
                timestamp: Date.now()
            };
        }
    }
    /**
     * 获取时间差
     * @param {Object} data 时间差参数
     * @returns {Object} 时间差信息
     */
    async getTimeDiff(data = {}) {
        try {
            const { start, end = Date.now(), unit = 'ms' } = data;
            if (!start) {
                throw new Error('缺少起始时间参数: start');
            }
            const startTime = new Date(start).getTime();
            const endTime = new Date(end).getTime();
            const diff = endTime - startTime;
            // 计算各种单位的时间差
            const diffInMs = diff;
            const diffInSeconds = diff / 1000;
            const diffInMinutes = diffInSeconds / 60;
            const diffInHours = diffInMinutes / 60;
            const diffInDays = diffInHours / 24;
            // 格式化时间差
            const formatDuration = (ms) => {
                const days = Math.floor(ms / (24 * 60 * 60 * 1000));
                const hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
                const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
                const seconds = Math.floor((ms % (60 * 1000)) / 1000);
                const milliseconds = ms % 1000;
                const parts = [];
                if (days > 0)
                    parts.push(`${days}天`);
                if (hours > 0)
                    parts.push(`${hours}小时`);
                if (minutes > 0)
                    parts.push(`${minutes}分钟`);
                if (seconds > 0)
                    parts.push(`${seconds}秒`);
                if (milliseconds > 0 && parts.length === 0)
                    parts.push(`${milliseconds}毫秒`);
                return parts.length > 0 ? parts.join(' ') : '0毫秒';
            };
            // 根据单位返回结果
            let result;
            switch (unit) {
                case 'ms':
                    result = diffInMs;
                    break;
                case 's':
                    result = diffInSeconds;
                    break;
                case 'm':
                    result = diffInMinutes;
                    break;
                case 'h':
                    result = diffInHours;
                    break;
                case 'd':
                    result = diffInDays;
                    break;
                default:
                    result = diffInMs;
            }
            return {
                success: true,
                action: 'time.diff',
                data: {
                    diff: result,
                    unit: unit,
                    start: startTime,
                    end: endTime,
                    formatted: formatDuration(Math.abs(diffInMs)),
                    isNegative: diff < 0,
                    breakdown: {
                        milliseconds: diffInMs,
                        seconds: diffInSeconds,
                        minutes: diffInMinutes,
                        hours: diffInHours,
                        days: diffInDays
                    }
                },
                timestamp: Date.now(),
                responseTime: 1
            };
        }
        catch (error) {
            logger.error('[MCP Handler] 计算时间差失败:', error);
            return {
                success: false,
                action: 'time.diff',
                error: error.message,
                timestamp: Date.now()
            };
        }
    }
    /**
     * 获取时区信息
     * @param {Object} data 时区参数
     * @returns {Object} 时区信息
     */
    async getTimezoneInfo(data = {}) {
        try {
            const { timezone = 'Asia/Shanghai' } = data;
            const now = new Date();
            const utcTime = now.getTime();
            const localTime = new Date(now.toLocaleString("en-US", { timeZone: timezone })).getTime();
            const offset = (localTime - utcTime) / (1000 * 60 * 60); // 小时偏移
            // 常用时区列表
            const commonTimezones = [
                'Asia/Shanghai',
                'Asia/Tokyo',
                'Europe/London',
                'Europe/Paris',
                'America/New_York',
                'America/Los_Angeles',
                'UTC'
            ];
            const timezoneData = {};
            for (const tz of commonTimezones) {
                const time = new Date(now.toLocaleString("en-US", { timeZone: tz }));
                timezoneData[tz] = {
                    time: time.toISOString(),
                    local: time.toLocaleString(),
                    offset: (time.getTime() - utcTime) / (1000 * 60 * 60)
                };
            }
            return {
                success: true,
                action: 'time.timezone',
                data: {
                    current: timezone,
                    offset: offset,
                    utc: now.toISOString(),
                    local: new Date(now.toLocaleString("en-US", { timeZone: timezone })).toISOString(),
                    timezones: timezoneData
                },
                timestamp: Date.now(),
                responseTime: 1
            };
        }
        catch (error) {
            logger.error('[MCP Handler] 获取时区信息失败:', error);
            return {
                success: false,
                action: 'time.timezone',
                error: error.message,
                timestamp: Date.now()
            };
        }
    }
}
// @ts-nocheck
//# sourceMappingURL=TimeManager.js.map