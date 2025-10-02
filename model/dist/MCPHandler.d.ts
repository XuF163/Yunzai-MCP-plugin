export declare class MCPHandler {
    constructor(config: any);
    setupActionMap(): void;
    getPublicActions(): string[];
    setupEventListeners(): void;
    saveImageFile(buffer: any, filePath: any): Promise<void>;
    saveImageFileAndRegister(buffer: any, filePath: any, fileName: any): Promise<any>;
    saveImageFileQuietly(buffer: any, filePath: any): Promise<void>;
    getImageResolution(imageData: any): Promise<{
        width: any;
        height: any;
        type: any;
    }>;
    formatButtonMessage(buttonItem: any): string;
    captureLog(level: any, args: any): void;
    recordMessageForResponse(messageData: any): void;
    handleAction(action: any, data: any, context: any): Promise<any>;
    handleBotRestart(data: any): Promise<{
        message: string;
        delay: any;
        force: any;
        timestamp: number;
        debug: string;
    }>;
    handleBotStatus(): Promise<{
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
    handleBotInfo(): Promise<{}>;
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
    /**
     * 解析消息格式，参考OneBotv11适配器的parseMsg方法
     * @param {Array|Object} msg 消息内容
     * @returns {Array} 解析后的消息数组
     */
    parseMessage(msg: any): any[];
    /**
     * 构建消息格式，参考OneBotv11适配器的makeMsg方法
     * @param {Array|Object|String} msg 原始消息
     * @returns {Array} 格式化后的消息数组
     */
    makeMessage(msg: any): Promise<any[][]>;
    /**
     * 发送消息的核心方法
     * @param {Array|Object|String} msg 消息内容
     * @param {Function} send 发送函数
     * @param {Function} sendForwardMsg 转发消息函数
     * @returns {Object} 发送结果
     */
    sendMessage(msg: any, send: any, sendForwardMsg: any): Promise<any>;
    /**
     * 发送好友消息
     * @param {Object} data 消息数据
     * @returns {Object} 发送结果
     */
    sendFriendMessage(data: any): Promise<{
        success: boolean;
        messageId: any;
        timestamp: number;
        type: string;
        target: any;
    }>;
    /**
     * 发送群消息
     * @param {Object} data 消息数据
     * @returns {Object} 发送结果
     */
    sendGroupMessage(data: any): Promise<{
        success: boolean;
        messageId: any;
        timestamp: number;
        type: string;
        target: any;
    }>;
    /**
     * 发送好友消息
     * @param {Object} data 消息数据
     * @returns {Object} 发送结果
     */
    handleSendFriendMessage(data: any): Promise<{
        success: boolean;
        messageId: any;
        timestamp: number;
        type: string;
        target: any;
    }>;
    /**
     * 发送群消息
     * @param {Object} data 消息数据
     * @returns {Object} 发送结果
     */
    handleSendGroupMessage(data: any): Promise<{
        success: boolean;
        messageId: any;
        timestamp: number;
        type: string;
        target: any;
    }>;
    /**
     * 统一的发送消息接口（兼容旧版本）
     * @param {Object} data 消息数据
     * @returns {Object} 发送结果
     */
    handleSendMessage(data: any): Promise<{
        success: boolean;
        messageId: any;
        timestamp: number;
        type: string;
        target: any;
    }>;
    /**
     * 撤回消息
     * @param {Object} data 撤回数据
     * @returns {Object} 撤回结果
     */
    handleRecallMessage(data: any): Promise<{
        success: boolean;
        messageId: any;
        result: any;
        timestamp: number;
    }>;
    /**
     * 获取消息历史记录
     * @param {Object} data 查询数据
     * @returns {Object} 历史记录
     */
    handleMessageHistory(data: any): Promise<{
        history: any;
        count: any;
        type: any;
        target: any;
        timestamp: number;
    }>;
    /**
     * 获取指定消息详情
     * @param {Object} data 查询数据
     * @returns {Object} 消息详情
     */
    handleGetMessage(data: any): Promise<{
        success: boolean;
        message: any;
        messageId: any;
        timestamp: number;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        messageId: any;
        timestamp: number;
        message?: undefined;
    }>;
    /**
     * 获取转发消息内容
     * @param {Object} data 查询数据
     * @returns {Object} 转发消息内容
     */
    handleGetForwardMessage(data: any): Promise<{
        success: boolean;
        forwardMsg: any;
        messageId: any;
        timestamp: number;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        messageId: any;
        timestamp: number;
        forwardMsg?: undefined;
    }>;
    handleRedisGet(data: any): Promise<{
        key: any;
        value: any;
        timestamp: number;
    }>;
    handleRedisSet(data: any): Promise<{
        success: boolean;
        key: any;
        timestamp: number;
    }>;
    handleRedisDel(data: any): Promise<{
        deleted: any;
        key: any;
        timestamp: number;
    }>;
    handleRedisKeys(data: any): Promise<{
        keys: any;
        pattern: any;
        count: any;
        timestamp: number;
    }>;
    handleRedisInfo(): Promise<{
        info: any;
        timestamp: number;
    }>;
    handlePluginList(): Promise<{
        plugins: any[];
        count: number;
        timestamp: number;
    }>;
    handlePluginInfo(data: any): Promise<{
        name: any;
        timestamp: number;
    }>;
    handleFileRead(data: any): Promise<{
        filePath: any;
        content: Buffer<ArrayBufferLike>;
        size: number;
        timestamp: number;
    }>;
    handleFileWrite(data: any): Promise<{
        success: boolean;
        filePath: any;
        size: any;
        timestamp: number;
    }>;
    handleFileList(data: any): Promise<{
        dirPath: any;
        files: {
            name: string;
            isDirectory: boolean;
            isFile: boolean;
        }[];
        count: number;
        timestamp: number;
    }>;
    handleFileDelete(data: any): Promise<{
        success: boolean;
        filePath: any;
        timestamp: number;
    }>;
    handleCommandExecute(data: any): Promise<{
        command: any;
        stdout: string;
        stderr: string;
        timestamp: number;
    }>;
    handleTestEvent(data: any): Promise<{
        success: boolean;
        eventType: any;
        eventData: any;
        timestamp: number;
    }>;
    handleTestMessage(data: any): Promise<{
        success: boolean;
        action: string;
        testEvent: {
            message_type: string;
            user_id: any;
            message: any;
            timestamp: number;
            self_id: string;
        };
        error?: undefined;
        timestamp?: undefined;
    } | {
        success: boolean;
        error: any;
        timestamp: number;
        action?: undefined;
        testEvent?: undefined;
    }>;
    handleDebugLogs(data: any): Promise<{
        logs: string[];
        count: number;
        timestamp: number;
        error?: undefined;
    } | {
        logs: any[];
        error: any;
        timestamp: number;
        count?: undefined;
    }>;
    handleStreamLogs(data: any): Promise<any>;
    handleGetMessageResponse(data: any): Promise<{
        responses: any[];
        count: number;
        totalBuffered: any;
        filters: {
            messageId: any;
            userId: any;
            groupId: any;
            since: any;
        };
        timestamp: number;
    }>;
    sanitizeResponseData(responseData: any): Promise<{
        timestamp: any;
        responses: any[];
    }>;
    sanitizeMessageData(messageData: any): {
        message_id: any;
        user_id: any;
        group_id: any;
        message_type: any;
        message: any;
        timestamp: any;
        self_id: any;
    };
    sanitizeContent(content: any): Promise<any>;
    handleListMessageResponses(): Promise<{
        responses: {
            key: any;
            messageId: any;
            userId: any;
            groupId: any;
            timestamp: any;
            responseCount: any;
            hasResponses: boolean;
        }[];
        count: number;
        timestamp: number;
    }>;
    handleDebugMemory(): Promise<{
        memory: {
            rss: number;
            heapTotal: number;
            heapUsed: number;
            external: number;
            arrayBuffers: number;
        };
        formatted: {
            rss: string;
            heapTotal: string;
            heapUsed: string;
        };
        timestamp: number;
    }>;
    handleDebugPerformance(): Promise<{
        uptime: number;
        cpuUsage: NodeJS.CpuUsage;
        platform: NodeJS.Platform;
        version: string;
        timestamp: number;
    }>;
    checkPermission(permission: any): void;
    handleSystemInfo(): Promise<{
        hostname: string;
        platform: NodeJS.Platform;
        arch: string;
        release: string;
        type: string;
        cpus: number;
        totalMemory: number;
        freeMemory: number;
        uptime: number;
        loadavg: number[];
        networkInterfaces: string[];
        timestamp: number;
    }>;
    handleSystemStats(): Promise<{
        cpu: {
            usage: NodeJS.CpuUsage;
            count: number;
            loadavg: number[];
        };
        memory: {
            total: number;
            free: number;
            used: number;
            process: NodeJS.MemoryUsage;
        };
        system: {
            uptime: number;
            platform: NodeJS.Platform;
            arch: string;
        };
        timestamp: number;
    }>;
    handleSystemProcesses(): Promise<{
        processes: {
            name: string;
            pid: string;
            sessionName: string;
            sessionNumber: string;
            memUsage: string;
        }[];
        count: number;
        timestamp: number;
        error?: undefined;
    } | {
        error: any;
        processes: any[];
        timestamp: number;
        count?: undefined;
    }>;
    handleNetworkPing(data: any): Promise<{
        host: any;
        result: string;
        success: boolean;
        timestamp: number;
        error?: undefined;
    } | {
        host: any;
        error: any;
        success: boolean;
        timestamp: number;
        result?: undefined;
    }>;
    handleNetworkRequest(data: any): Promise<{
        url: any;
        status: number;
        statusText: string;
        headers: {
            [k: string]: string;
        };
        data: string;
        timestamp: number;
        error?: undefined;
    } | {
        url: any;
        error: any;
        timestamp: number;
        status?: undefined;
        statusText?: undefined;
        headers?: undefined;
        data?: undefined;
    }>;
    handleNetworkDownload(data: any): Promise<{
        url: any;
        savePath: any;
        size: number;
        success: boolean;
        timestamp: number;
        error?: undefined;
    } | {
        url: any;
        savePath: any;
        error: any;
        success: boolean;
        timestamp: number;
        size?: undefined;
    }>;
    handleDatabaseQuery(data: any): Promise<{
        query: any;
        result: any;
        type: any;
        timestamp: number;
        error?: undefined;
    } | {
        query: any;
        error: any;
        type: any;
        timestamp: number;
        result?: undefined;
    }>;
    handleDatabaseBackup(data: any): Promise<{
        backupPath: any;
        success: boolean;
        message: string;
        timestamp: number;
        error?: undefined;
    } | {
        backupPath: any;
        error: any;
        success: boolean;
        timestamp: number;
        message?: undefined;
    }>;
    handleDatabaseRestore(data: any): Promise<{
        backupPath: any;
        message: string;
        timestamp: number;
    }>;
    handleSchedulerAdd(data: any): Promise<{
        name: any;
        cron: any;
        action: any;
        success: boolean;
        timestamp: number;
    }>;
    handleSchedulerRemove(data: any): Promise<{
        name: any;
        removed: any;
        timestamp: number;
    }>;
    handleSchedulerList(): Promise<{
        tasks: any[];
        count: number;
        timestamp: number;
    }>;
    handleUserInfo(data: any): Promise<{
        userId: any;
        info: any;
        timestamp: number;
        error?: undefined;
    } | {
        userId: any;
        error: any;
        timestamp: number;
        info?: undefined;
    }>;
    handleUserList(data: any): Promise<{
        friends: {
            user_id: any;
            nickname: any;
            remark: any;
        }[];
        count: number;
        total: any;
        timestamp: number;
        error?: undefined;
    } | {
        error: any;
        friends: any[];
        timestamp: number;
        count?: undefined;
        total?: undefined;
    }>;
    handleUserBan(data: any): Promise<{
        userId: any;
        reason: any;
        banned: boolean;
        timestamp: number;
    }>;
    handleUserUnban(data: any): Promise<{
        userId: any;
        unbanned: any;
        timestamp: number;
    }>;
    handleGroupInfo(data: any): Promise<{
        groupId: any;
        info: any;
        timestamp: number;
        error?: undefined;
    } | {
        groupId: any;
        error: any;
        timestamp: number;
        info?: undefined;
    }>;
    handleGroupList(): Promise<{
        groups: {
            group_id: any;
            group_name: any;
            member_count: any;
        }[];
        count: number;
        timestamp: number;
        error?: undefined;
    } | {
        error: any;
        groups: any[];
        timestamp: number;
        count?: undefined;
    }>;
    handleGroupMembers(data: any): Promise<{
        groupId: any;
        members: {
            user_id: any;
            nickname: any;
            card: any;
            role: any;
        }[];
        count: number;
        total: any;
        timestamp: number;
        error?: undefined;
    } | {
        groupId: any;
        error: any;
        members: any[];
        timestamp: number;
        count?: undefined;
        total?: undefined;
    }>;
    handleGroupKick(data: any): Promise<{
        groupId: any;
        userId: any;
        reason: any;
        success: boolean;
        timestamp: number;
        error?: undefined;
    } | {
        groupId: any;
        userId: any;
        error: any;
        success: boolean;
        timestamp: number;
        reason?: undefined;
    }>;
    handleGroupMute(data: any): Promise<{
        groupId: any;
        userId: any;
        duration: any;
        success: boolean;
        timestamp: number;
        error?: undefined;
    } | {
        groupId: any;
        userId: any;
        error: any;
        success: boolean;
        timestamp: number;
        duration?: undefined;
    }>;
    handleGroupUnmute(data: any): Promise<{
        groupId: any;
        userId: any;
        success: boolean;
        timestamp: number;
        error?: undefined;
    } | {
        groupId: any;
        userId: any;
        error: any;
        success: boolean;
        timestamp: number;
    }>;
    handleAIChat(data: any): Promise<{
        message: any;
        response: string;
        model: any;
        timestamp: number;
    }>;
    handleAIImage(data: any): Promise<{
        prompt: any;
        imageUrl: string;
        size: any;
        message: string;
        timestamp: number;
    }>;
    handleAITranslate(data: any): Promise<{
        text: any;
        translatedText: string;
        from: any;
        to: any;
        timestamp: number;
    }>;
    handleMediaConvert(data: any): Promise<{
        inputPath: any;
        outputPath: any;
        format: any;
        message: string;
        timestamp: number;
    }>;
    handleMediaCompress(data: any): Promise<{
        inputPath: any;
        outputPath: any;
        quality: any;
        message: string;
        timestamp: number;
    }>;
    handleMediaInfo(data: any): Promise<{
        filePath: any;
        size: number;
        created: Date;
        modified: Date;
        isFile: boolean;
        isDirectory: boolean;
        timestamp: number;
        error?: undefined;
    } | {
        filePath: any;
        error: any;
        timestamp: number;
        size?: undefined;
        created?: undefined;
        modified?: undefined;
        isFile?: undefined;
        isDirectory?: undefined;
    }>;
    broadcastEvent(eventType: any, eventData: any): void;
    /**
     * 获取当前时间信息（精确到毫秒）
     * @param {Object} data - 请求数据 {timezone?}
     * @returns {Object} 时间信息
     */
    handleGetTime(data: any): Promise<{
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
}
