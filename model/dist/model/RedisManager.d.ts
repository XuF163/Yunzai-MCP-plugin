/**
 * Redis 数据库管理模块
 * 负责 Redis 数据的增删改查等操作
 */
export declare class RedisManager {
    constructor(config: any);
    /**
     * 检查权限
     * @param {string} permission 权限名称
     */
    checkPermission(permission: any): void;
    /**
     * 获取 Redis 值
     * @param {Object} data 查询参数
     * @returns {Object} 查询结果
     */
    get(data: any): Promise<{
        success: boolean;
        action: string;
        data: {
            key: any;
            value: any;
            exists: boolean;
            type: "string" | "number" | "bigint" | "boolean" | "symbol" | "undefined" | "object" | "function";
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
     * 设置 Redis 值
     * @param {Object} data 设置参数
     * @returns {Object} 设置结果
     */
    set(data: any): Promise<{
        success: boolean;
        action: string;
        data: {
            key: any;
            value: any;
            expire: any;
            result: any;
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
     * 删除 Redis 键
     * @param {Object} data 删除参数
     * @returns {Object} 删除结果
     */
    del(data: any): Promise<{
        success: boolean;
        action: string;
        data: {
            key: any;
            keys: any;
            deletedCount: any;
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
     * 查找 Redis 键
     * @param {Object} data 查找参数
     * @returns {Object} 查找结果
     */
    keys(data: any): Promise<{
        success: boolean;
        action: string;
        data: {
            pattern: any;
            keys: any;
            total: any;
            limited: boolean;
            limit: any;
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
     * 获取 Redis 信息
     * @returns {Object} Redis 信息
     */
    info(): Promise<{
        success: boolean;
        action: string;
        data: {
            server: {
                version: any;
                mode: any;
                os: any;
                uptime: any;
            };
            clients: {
                connected: any;
                blocked: any;
            };
            memory: {
                used: any;
                used_human: any;
                peak: any;
                peak_human: any;
            };
            stats: {
                total_connections: any;
                total_commands: any;
                keyspace_hits: any;
                keyspace_misses: any;
            };
            database: {
                size: any;
                keys: any;
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
     * 检查 Redis 键是否存在
     * @param {Object} data 检查参数
     * @returns {Object} 检查结果
     */
    exists(data: any): Promise<{
        success: boolean;
        action: string;
        data: {
            key: any;
            keys: any;
            exists: boolean;
            count: any;
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
     * 获取 Redis 键的 TTL
     * @param {Object} data 查询参数
     * @returns {Object} TTL 结果
     */
    ttl(data: any): Promise<{
        success: boolean;
        action: string;
        data: {
            key: any;
            ttl: any;
            status: any;
            expires_at: number;
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
     * 设置 Redis 键的过期时间
     * @param {Object} data 设置参数
     * @returns {Object} 设置结果
     */
    expire(data: any): Promise<{
        success: boolean;
        action: string;
        data: {
            key: any;
            seconds: any;
            success: boolean;
            expires_at: number;
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
}
