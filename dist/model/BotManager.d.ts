/**
 * Bot 控制和状态管理模块
 * 负责 Bot 的启动、停止、重启、状态查询等功能
 */
export declare class BotManager {
    constructor(config: any);
    /**
     * 检查权限
     * @param {string} permission 权限名称
     */
    checkPermission(permission: any): void;
    /**
     * Bot 重启
     * @param {Object} data 重启参数
     * @returns {Object} 重启结果
     */
    restart(data: any): Promise<{
        success: boolean;
        message: string;
        delay: number;
        force: any;
        timestamp: number;
    }>;
    /**
     * Bot 关闭
     * @param {Object} data 关闭参数
     * @returns {Object} 关闭结果
     */
    shutdown(data: any): Promise<{
        success: boolean;
        message: string;
        delay: any;
        timestamp: number;
    }>;
    /**
     * 获取 Bot 状态
     * @returns {Object} Bot 状态信息
     */
    getStatus(): Promise<{
        success: boolean;
        action: string;
        data: {
            online: boolean;
            uptime: number;
            startTime: number;
            system: {
                platform: NodeJS.Platform;
                arch: NodeJS.Architecture;
                nodeVersion: string;
                memory: NodeJS.MemoryUsage;
                pid: number;
                cwd: string;
            };
            renderers: {
                count: number;
                active: number;
                list: any[];
                error?: undefined;
            } | {
                error: any;
                count: number;
                active: number;
                list: any[];
            };
            databases: {
                count: number;
                active: number;
                list: any[];
                error?: undefined;
            } | {
                error: any;
                count: number;
                active: number;
                list: any[];
            };
            servers: {
                count: number;
                active: number;
                list: any[];
                error?: undefined;
            } | {
                error: any;
                count: number;
                active: number;
                list: any[];
            };
            routes: {
                count: number;
                list: any[];
                error?: undefined;
            } | {
                error: any;
                count: number;
                list: any[];
            };
            plugins: {
                count: number;
                enabled: number;
                disabled: number;
                list: any[];
                error?: undefined;
            } | {
                error: any;
                count: number;
                enabled: number;
                disabled: number;
                list: any[];
            };
            scheduledTasks: {
                count: number;
                active: number;
                timers: any;
                list: any[];
                error?: undefined;
            } | {
                error: any;
                count: number;
                active: number;
                timers: number;
                list: any[];
            };
            handlers: {
                count: number;
                totalListeners: any;
                list: any[];
                error?: undefined;
            } | {
                error: any;
                count: number;
                totalListeners: number;
                list: any[];
            };
            listeners: {
                count: number;
                totalListeners: any;
                list: any[];
                error?: undefined;
            } | {
                error: any;
                count: number;
                totalListeners: number;
                list: any[];
            };
            adapters: {
                adapters: {
                    count: number;
                    list: any[];
                };
                bots: {
                    count: number;
                    online: number;
                    offline: number;
                    list: any[];
                };
                summary: {
                    totalAdapters: number;
                    totalBots: number;
                    onlineBots: number;
                };
                error?: undefined;
            } | {
                error: any;
                adapters: {
                    count: number;
                    list: any[];
                };
                bots: {
                    count: number;
                    online: number;
                    offline: number;
                    list: any[];
                };
                summary: {
                    totalAdapters: number;
                    totalBots: number;
                    onlineBots: number;
                };
            };
            accounts: {
                count: number;
                online: number;
                totalFriends: any;
                totalGroups: any;
                list: any[];
                error?: undefined;
            } | {
                error: any;
                count: number;
                online: number;
                totalFriends: number;
                totalGroups: number;
                list: any[];
            };
            globals: {
                important: {};
                all: {};
                environment: {
                    NODE_ENV: string;
                    NODE_VERSION: string;
                    PLATFORM: NodeJS.Platform;
                    ARCH: NodeJS.Architecture;
                    TZ: string;
                };
                globalCount: number;
                envCount: number;
                globalKeys: string[];
                error?: undefined;
            } | {
                error: any;
                important: {};
                all: {};
                environment: {};
                globalCount: number;
                envCount: number;
                globalKeys: any[];
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
     * 获取 Bot 信息
     * @returns {Object} Bot 信息
     */
    getInfo(): Promise<{}>;
    getRendererInfo(): {
        count: number;
        active: number;
        list: any[];
        error?: undefined;
    } | {
        error: any;
        count: number;
        active: number;
        list: any[];
    };
    getDatabaseInfo(): {
        count: number;
        active: number;
        list: any[];
        error?: undefined;
    } | {
        error: any;
        count: number;
        active: number;
        list: any[];
    };
    getServerInfo(): {
        count: number;
        active: number;
        list: any[];
        error?: undefined;
    } | {
        error: any;
        count: number;
        active: number;
        list: any[];
    };
    getRouteInfo(): {
        count: number;
        list: any[];
        error?: undefined;
    } | {
        error: any;
        count: number;
        list: any[];
    };
    getPluginInfo(): {
        count: number;
        enabled: number;
        disabled: number;
        list: any[];
        error?: undefined;
    } | {
        error: any;
        count: number;
        enabled: number;
        disabled: number;
        list: any[];
    };
    getScheduledTaskInfo(): {
        count: number;
        active: number;
        timers: any;
        list: any[];
        error?: undefined;
    } | {
        error: any;
        count: number;
        active: number;
        timers: number;
        list: any[];
    };
    getHandlerInfo(): {
        count: number;
        totalListeners: any;
        list: any[];
        error?: undefined;
    } | {
        error: any;
        count: number;
        totalListeners: number;
        list: any[];
    };
    getListenerInfo(): {
        count: number;
        totalListeners: any;
        list: any[];
        error?: undefined;
    } | {
        error: any;
        count: number;
        totalListeners: number;
        list: any[];
    };
    getAdapterInfo(): {
        adapters: {
            count: number;
            list: any[];
        };
        bots: {
            count: number;
            online: number;
            offline: number;
            list: any[];
        };
        summary: {
            totalAdapters: number;
            totalBots: number;
            onlineBots: number;
        };
        error?: undefined;
    } | {
        error: any;
        adapters: {
            count: number;
            list: any[];
        };
        bots: {
            count: number;
            online: number;
            offline: number;
            list: any[];
        };
        summary: {
            totalAdapters: number;
            totalBots: number;
            onlineBots: number;
        };
    };
    getAccountInfo(): {
        count: number;
        online: number;
        totalFriends: any;
        totalGroups: any;
        list: any[];
        error?: undefined;
    } | {
        error: any;
        count: number;
        online: number;
        totalFriends: number;
        totalGroups: number;
        list: any[];
    };
    getGlobalVariableInfo(): {
        important: {};
        all: {};
        environment: {
            NODE_ENV: string;
            NODE_VERSION: string;
            PLATFORM: NodeJS.Platform;
            ARCH: NodeJS.Architecture;
            TZ: string;
        };
        globalCount: number;
        envCount: number;
        globalKeys: string[];
        error?: undefined;
    } | {
        error: any;
        important: {};
        all: {};
        environment: {};
        globalCount: number;
        envCount: number;
        globalKeys: any[];
    };
    getVariableInfo(value: any): "null" | "undefined" | {
        type: string;
        name: any;
        length: any;
        size?: undefined;
        constructor?: undefined;
        keyCount?: undefined;
        keys?: undefined;
        preview?: undefined;
        value?: undefined;
        error?: undefined;
    } | {
        type: string;
        length: number;
        name?: undefined;
        size?: undefined;
        constructor?: undefined;
        keyCount?: undefined;
        keys?: undefined;
        preview?: undefined;
        value?: undefined;
        error?: undefined;
    } | {
        type: string;
        size: number;
        name?: undefined;
        length?: undefined;
        constructor?: undefined;
        keyCount?: undefined;
        keys?: undefined;
        preview?: undefined;
        value?: undefined;
        error?: undefined;
    } | {
        type: string;
        constructor: any;
        keyCount: number;
        keys: string[];
        name?: undefined;
        length?: undefined;
        size?: undefined;
        preview?: undefined;
        value?: undefined;
        error?: undefined;
    } | {
        type: string;
        length: any;
        preview: any;
        name?: undefined;
        size?: undefined;
        constructor?: undefined;
        keyCount?: undefined;
        keys?: undefined;
        value?: undefined;
        error?: undefined;
    } | {
        type: string;
        value: any;
        name?: undefined;
        length?: undefined;
        size?: undefined;
        constructor?: undefined;
        keyCount?: undefined;
        keys?: undefined;
        preview?: undefined;
        error?: undefined;
    } | {
        error: any;
        type?: undefined;
        name?: undefined;
        length?: undefined;
        size?: undefined;
        constructor?: undefined;
        keyCount?: undefined;
        keys?: undefined;
        preview?: undefined;
        value?: undefined;
    };
}
