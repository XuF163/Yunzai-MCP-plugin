// @ts-nocheck
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs/promises';
import path from 'node:path';
import sizeOf from 'image-size';
import RendererLoader from '../../../../lib/renderer/loader.js';
// 导入模块化的管理器
import { BotManager } from './model/BotManager.js';
import { MessageHandler } from './model/MessageHandler.js';
import { TimeManager } from './model/TimeManager.js';
import { RedisManager } from './model/RedisManager.js';
import { LogManager } from './model/LogManager.js';
import { FileManager } from './model/FileManager.js';
import { SystemMonitor } from './model/SystemMonitor.js';
import { NetworkManager } from './model/NetworkManager.js';
import { MockEnvironment } from './adapter/MockAdapter.js';
const execAsync = promisify(exec);
export class MCPHandler {
    constructor(config) {
        this.config = config;
        this.eventListeners = new Map();
        this.messageResponseBuffer = new Map(); // 存储消息响应
        // 初始化模块化管理器
        this.botManager = new BotManager(config);
        this.messageHandler = new MessageHandler(config);
        this.timeManager = new TimeManager(config);
        this.redisManager = new RedisManager(config);
        this.logManager = new LogManager(config);
        this.fileManager = new FileManager(config);
        this.systemMonitor = new SystemMonitor(config);
        this.networkManager = new NetworkManager(config);
        // 注册专用 Mock 适配器与 Bot 实例
        this.mock = new MockEnvironment(this);
        this.mock.init();
        this.setupEventListeners();
        this.setupActionMap();
    }
    setupActionMap() {
        this.actionMap = {
            // Bot 管理相关 - 使用 BotManager
            'bot.shutdown': this.botManager.shutdown.bind(this.botManager),
            'bot.restart': this.botManager.restart.bind(this.botManager),
            'bot.status': this.botManager.getStatus.bind(this.botManager),
            'bot.info': this.botManager.getInfo.bind(this.botManager),
            // 消息处理相关 - 使用 MessageHandler（仅保留必要查询/撤回能力）
            'recall.message': this.messageHandler.recallMessage.bind(this.messageHandler),
            'message.history': this.messageHandler.getMessageHistory.bind(this.messageHandler),
            'message.get': this.messageHandler.getMessage.bind(this.messageHandler),
            'message.forward': this.messageHandler.getForwardMessage.bind(this.messageHandler),
            // 时间管理相关 - 使用 TimeManager
            'time.get': this.timeManager.getTime.bind(this.timeManager),
            'time.format': this.timeManager.formatTime.bind(this.timeManager),
            'time.diff': this.timeManager.getTimeDiff.bind(this.timeManager),
            'time.timezone': this.timeManager.getTimezoneInfo.bind(this.timeManager),
            // Redis 管理相关 - 使用 RedisManager
            'redis.get': this.redisManager.get.bind(this.redisManager),
            'redis.set': this.redisManager.set.bind(this.redisManager),
            'redis.del': this.redisManager.del.bind(this.redisManager),
            'redis.keys': this.redisManager.keys.bind(this.redisManager),
            'redis.info': this.redisManager.info.bind(this.redisManager),
            'redis.exists': this.redisManager.exists.bind(this.redisManager),
            'redis.ttl': this.redisManager.ttl.bind(this.redisManager),
            'redis.expire': this.redisManager.expire.bind(this.redisManager),
            // 日志管理相关 - 使用 LogManager
            'logs.get': this.logManager.getLogs.bind(this.logManager),
            'logs.clear': this.logManager.clearLogs.bind(this.logManager),
            'logs.stats': this.logManager.getLogStats.bind(this.logManager),
            'logs.setLevel': this.logManager.setLogLevel.bind(this.logManager),
            'logs.export': this.logManager.exportLogs.bind(this.logManager),
            // 文件管理相关 - 使用 FileManager
            'file.read': this.fileManager.readFile.bind(this.fileManager),
            'file.write': this.fileManager.writeFile.bind(this.fileManager),
            'file.delete': this.fileManager.deleteFile.bind(this.fileManager),
            'file.list': this.fileManager.listDirectory.bind(this.fileManager),
            'file.info': this.fileManager.getFileInfo.bind(this.fileManager),
            // 系统监控相关 - 使用 SystemMonitor
            'system.info': this.systemMonitor.getSystemInfo.bind(this.systemMonitor),
            'system.stats': this.systemMonitor.getSystemStats.bind(this.systemMonitor),
            'system.processes': this.systemMonitor.getProcesses.bind(this.systemMonitor),
            'memory.info': this.systemMonitor.getMemoryInfo.bind(this.systemMonitor),
            'system.performance': this.systemMonitor.getPerformanceMetrics.bind(this.systemMonitor),
            // 网络管理相关 - 使用 NetworkManager
            'network.ping': this.networkManager.ping.bind(this.networkManager),
            'network.request': this.networkManager.request.bind(this.networkManager),
            'network.download': this.networkManager.download.bind(this.networkManager),
            'network.connectivity': this.networkManager.checkConnectivity.bind(this.networkManager),
            'network.interfaces': this.networkManager.getNetworkInterfaces.bind(this.networkManager),
            'network.testPort': this.networkManager.testPort.bind(this.networkManager),
            // 渲染相关
            'render.template': this.handleRenderTemplate.bind(this),
            // 唯一入站入口（专用 Mock 适配器）
            'mock.incoming.message': this.mock.incomingMessage.bind(this.mock),
            // Mock 适配器管理与出站模拟
            'mock.init': this.mock.init.bind(this.mock),
            'mock.reset': this.mock.reset.bind(this.mock),
            'mock.status': this.mock.status.bind(this.mock),
            'mock.friend.add': this.mock.addFriend.bind(this.mock),
            'mock.friend.remove': this.mock.removeFriend.bind(this.mock),
            'mock.friend.list': this.mock.listFriends.bind(this.mock),
            'mock.group.add': this.mock.addGroup.bind(this.mock),
            'mock.group.remove': this.mock.removeGroup.bind(this.mock),
            'mock.group.list': this.mock.listGroups.bind(this.mock),
            'mock.group.member.add': this.mock.addMember.bind(this.mock),
            'mock.group.member.remove': this.mock.removeMember.bind(this.mock),
            'mock.group.members': this.mock.listMembers.bind(this.mock),
            'mock.send.friend': this.mock.sendFriend.bind(this.mock),
            'mock.send.group': this.mock.sendGroup.bind(this.mock),
            'mock.history': this.mock.history.bind(this.mock)
        };
    }
    getPublicActions() {
        // 返回供能力枚举使用的动作列表
        return Object.keys(this.actionMap);
    }
    setupEventListeners() {
        // 监听Bot消息事件
        Bot.on('message', (data) => {
            this.broadcastEvent('message', data);
            // 记录消息到缓冲区，用于后续获取响应
            this.recordMessageForResponse(data);
        });
        // 监听Bot通知事件
        Bot.on('notice', (data) => {
            this.broadcastEvent('notice', data);
        });
        // 监听Bot请求事件
        Bot.on('request', (data) => {
            this.broadcastEvent('request', data);
        });
    }
    async handleRenderTemplate(data = {}) {
        this.checkPermission('allowRenderer');
        const templateInput = data.template || data.tpl || data.tplFile || data.path || data.html;
        if (!templateInput || typeof templateInput !== 'string') {
            throw new Error('template 字段不能为空');
        }
        const normalizedPath = templateInput.trim().replace(/\\/g, '/');
        if (!normalizedPath || normalizedPath.includes('..')) {
            throw new Error('模板路径不合法');
        }
        const workspaceRoot = process.cwd();
        const absoluteTemplatePath = path.isAbsolute(normalizedPath)
            ? normalizedPath
            : path.resolve(workspaceRoot, normalizedPath);
        if (!absoluteTemplatePath.startsWith(workspaceRoot)) {
            throw new Error('模板路径必须位于 Bot 工作目录内');
        }
        let stat;
        try {
            stat = await fs.stat(absoluteTemplatePath);
        }
        catch (error) {
            throw new Error(`模板文件不存在: ${absoluteTemplatePath}`);
        }
        if (!stat.isFile()) {
            throw new Error(`模板路径不是文件: ${absoluteTemplatePath}`);
        }
        const relativePath = path.relative(workspaceRoot, absoluteTemplatePath).replace(/\\/g, '/');
        const htmlWithoutExt = relativePath.replace(/\.html?$/i, '');
        const fileBaseName = path.basename(htmlWithoutExt) || 'render';
        const cloneData = (source) => {
            if (!source || typeof source !== 'object')
                return {};
            try {
                if (typeof structuredClone === 'function') {
                    return structuredClone(source);
                }
            }
            catch {
                // ignore structuredClone errors
            }
            return JSON.parse(JSON.stringify(source));
        };
        const templateData = cloneData(data.data);
        const options = (data.options && typeof data.options === 'object') ? { ...data.options } : {};
        let pluginName = data.plugin;
        let templateRelative = htmlWithoutExt;
        const resourceMatch = relativePath.match(/^plugins\/([^/]+)\/resources\/(.+)\.html$/i);
        if (resourceMatch) {
            pluginName = pluginName || resourceMatch[1];
            templateRelative = resourceMatch[2];
        }
        const renderName = pluginName ? `${pluginName}/${templateRelative}` : templateRelative;
        const saveId = options.saveId || templateData.saveId || fileBaseName;
        const imgType = (options.imgType || 'png').toLowerCase();
        const renderPayload = {
            sys: templateData.sys || { scale: 1 },
            ...templateData,
            tplFile: absoluteTemplatePath,
            saveId,
            imgType
        };
        if (renderPayload.orientation === undefined) {
            renderPayload.orientation = 'auto';
        }
        if (pluginName) {
            const pluResPath = `./plugins/${pluginName}/resources/`;
            renderPayload._plugin = pluginName;
            renderPayload._htmlPath = templateRelative;
            renderPayload.pluResPath = pluResPath;
            renderPayload._res_path = pluResPath;
            const miaoResPath = path.join(workspaceRoot, 'plugins/miao-plugin/resources');
            renderPayload._miao_path = miaoResPath;
            renderPayload._tpl_path = path.join(miaoResPath, 'common/tpl/');
            renderPayload.defaultLayout = path.join(miaoResPath, 'common/layout/default.html');
            renderPayload.elemLayout = path.join(miaoResPath, 'common/layout/elem.html');
            renderPayload.copyright = renderPayload.copyright || 'Created By 那拉小派蒙 & bot.genshin.icu ';
        }
        else {
            renderPayload._htmlPath = templateRelative;
        }
        for (const [key, value] of Object.entries(options)) {
            if (value !== undefined) {
                renderPayload[key] = value;
            }
        }
        const renderer = RendererLoader.getRenderer();
        if (!renderer || typeof renderer.render !== 'function') {
            throw new Error('未找到可用的渲染器实例');
        }
        const renderResult = await renderer.render(renderName, renderPayload);
        if (!renderResult) {
            throw new Error('渲染失败，未返回任何内容');
        }
        const buffers = Array.isArray(renderResult) ? renderResult : [renderResult];
        const outputDir = path.join(workspaceRoot, 'data/mcp_client');
        await fs.mkdir(outputDir, { recursive: true });
        const extension = imgType === 'png' ? 'png' : (imgType === 'webp' ? 'webp' : 'jpg');
        const baseSeed = (data.outputName || `${fileBaseName}-${Date.now().toString(36)}`).toString();
        const sanitizedSeed = baseSeed.replace(/[^a-zA-Z0-9-_]/g, '_');
        const outputs = [];
        for (let index = 0; index < buffers.length; index++) {
            const buffer = buffers[index];
            if (!Buffer.isBuffer(buffer)) {
                throw new Error('渲染输出格式不支持');
            }
            const suffix = buffers.length > 1 ? `-${index + 1}` : '';
            const fileName = `${sanitizedSeed}${suffix}.${extension}`;
            const absoluteOutput = path.join(outputDir, fileName);
            const fileUrl = await this.saveImageFileAndRegister(buffer, absoluteOutput, fileName);
            outputs.push({
                path: path.posix.join('data/mcp_client', fileName),
                absolutePath: absoluteOutput,
                url: fileUrl,
                size: buffer.length
            });
        }
        return {
            template: relativePath,
            plugin: pluginName || null,
            name: renderName,
            count: outputs.length,
            outputs,
            options: {
                imgType,
                setViewport: renderPayload.setViewport || null,
                multiPage: !!renderPayload.multiPage
            }
        };
    }
    // 保存图片文件的方法
    async saveImageFile(buffer, filePath) {
        try {
            // 确保目录存在
            const dir = path.dirname(filePath);
            await fs.mkdir(dir, { recursive: true });
            // 保存文件
            await fs.writeFile(filePath, buffer);
            logger.debug(`[MCP] 图片文件已保存: ${filePath}`);
        }
        catch (error) {
            logger.error(`[MCP] 保存图片文件失败: ${filePath}`, error);
            throw error;
        }
    }
    // 保存图片文件并注册到HTTP服务器
    async saveImageFileAndRegister(buffer, filePath, fileName) {
        try {
            // 确保目录存在
            const dir = path.dirname(filePath);
            await fs.mkdir(dir, { recursive: true });
            // 保存文件到磁盘
            await fs.writeFile(filePath, buffer);
            // 使用 Bot.fileToUrl 注册文件到HTTP服务器
            const fileUrl = await Bot.fileToUrl(buffer, { name: fileName });
            // 只打印一次完整的日志信息
            logger.debug(`[MCP] 图片文件已保存: ${filePath}`);
            logger.debug(`[MCP] 图片文件已注册到HTTP服务器: ${fileUrl}`);
            return fileUrl;
        }
        catch (error) {
            logger.error(`[MCP] 保存或注册图片文件失败: ${filePath}`, error);
            throw error;
        }
    }
    // 静默保存图片文件（不打印日志）
    async saveImageFileQuietly(buffer, filePath) {
        try {
            // 确保目录存在
            const dir = path.dirname(filePath);
            await fs.mkdir(dir, { recursive: true });
            // 保存文件到磁盘
            await fs.writeFile(filePath, buffer);
        }
        catch (error) {
            logger.error(`[MCP] 保存图片文件失败: ${filePath}`, error);
            throw error;
        }
    }
    // 获取图片分辨率信息
    async getImageResolution(imageData) {
        try {
            let buffer;
            // 处理不同类型的图片数据
            if (Buffer.isBuffer(imageData)) {
                buffer = imageData;
            }
            else if (typeof imageData === 'string') {
                // 如果是文件路径
                if (imageData.startsWith('http://') || imageData.startsWith('https://')) {
                    // 网络图片，暂时跳过分辨率检测
                    return null;
                }
                else if (imageData.startsWith('base64://')) {
                    // base64编码的图片
                    const base64Data = imageData.replace('base64://', '');
                    buffer = Buffer.from(base64Data, 'base64');
                }
                else {
                    // 本地文件路径
                    try {
                        buffer = await fs.readFile(imageData);
                    }
                    catch (error) {
                        // 文件不存在或无法读取
                        return null;
                    }
                }
            }
            else {
                return null;
            }
            // 使用image-size库获取图片尺寸
            const dimensions = sizeOf(buffer);
            if (dimensions.width && dimensions.height) {
                return {
                    width: dimensions.width,
                    height: dimensions.height,
                    type: dimensions.type || 'unknown'
                };
            }
            return null;
        }
        catch (error) {
            // 静默处理错误，不影响主要功能
            logger.debug(`[MCP] 获取图片分辨率失败: ${error.message}`);
            return null;
        }
    }
    // 格式化按钮消息为紧凑格式
    formatButtonMessage(buttonItem) {
        if (!buttonItem || buttonItem.type !== 'button' || !buttonItem.data) {
            return JSON.stringify(buttonItem);
        }
        const formatArray = (arr) => {
            if (!Array.isArray(arr))
                return JSON.stringify(arr);
            const items = arr.map(item => {
                if (Array.isArray(item)) {
                    const subItems = item.map(subItem => JSON.stringify(subItem)).join(', ');
                    return `[ ${subItems}, [length]: ${item.length} ]`;
                }
                else {
                    return JSON.stringify(item);
                }
            });
            return `[\n    ${items.join(',\n    ')},\n    [length]: ${arr.length}\n  ]`;
        };
        return `{\n  type: 'button',\n  data: ${formatArray(buttonItem.data)}\n}`;
    }
    // setupLogCapture 已迁移到 LogManager
    captureLog(level, args) {
        // 现在通过 LogManager 处理日志捕获
        if (this.logManager) {
            this.logManager.addLogEntry(level, args);
        }
    }
    recordMessageForResponse(messageData) {
        // 为消息创建一个唯一标识
        const messageKey = `${messageData.user_id || messageData.group_id}_${messageData.message_id || Date.now()}`;
        // 存储消息数据，等待响应
        this.messageResponseBuffer.set(messageKey, {
            originalMessage: messageData,
            timestamp: Date.now(),
            responses: []
        });
        // 设置超时清理
        setTimeout(() => {
            if (this.messageResponseBuffer.has(messageKey)) {
                this.messageResponseBuffer.delete(messageKey);
            }
        }, 30000); // 30秒后清理
    }
    async handleAction(action, data, context) {
        // 只对非常用操作打印日志，避免刷屏
        const quietActions = ['logs.get', 'message.response', 'bot.status'];
        if (!quietActions.includes(action)) {
            logger.info(`[MCP Handler] 处理动作: ${action}`);
        }
        // 使用 actionMap 进行统一路由
        if (this.actionMap[action]) {
            return await this.actionMap[action](data, context);
        }
        // 如果 actionMap 中没有找到，使用旧的 switch 语句作为后备
        switch (action) {
            // 日志流相关（未迁移到 LogManager）
            case 'logs.stream':
                return await this.handleStreamLogs(data);
            // 消息响应相关
            case 'message.response':
                return await this.handleGetMessageResponse(data);
            case 'message.responses.list':
                return await this.handleListMessageResponses();
            // 消息相关（已迁移到 MessageHandler 和 actionMap）
            // Redis相关（已迁移到 RedisManager 和 actionMap）
            // 插件相关
            case 'plugin.list':
                return await this.handlePluginList();
            case 'plugin.info':
                return await this.handlePluginInfo(data);
            case 'plugin.reload':
                return await this.handlePluginReload(data);
            case 'plugin.disable':
                return await this.handlePluginDisable(data);
            case 'plugin.enable':
                return await this.handlePluginEnable(data);
            // 文件操作相关（已迁移到 FileManager 和 actionMap）
            // 命令执行相关
            case 'command.execute':
                return await this.handleCommandExecute(data);
            // 测试相关
            case 'test.event':
                return await this.handleTestEvent(data);
            case 'test.message':
                return await this.handleTestMessage(data);
            // 调试相关（部分已迁移到 SystemMonitor 和 actionMap）
            case 'debug.logs':
                return await this.handleDebugLogs(data);
            case 'debug.performance':
                return await this.handleDebugPerformance();
            // 系统监控相关（已迁移到 SystemMonitor 和 actionMap）
            // 网络相关（已迁移到 NetworkManager 和 actionMap）
            // 数据库相关
            case 'database.query':
                return await this.handleDatabaseQuery(data);
            case 'database.backup':
                return await this.handleDatabaseBackup(data);
            case 'database.restore':
                return await this.handleDatabaseRestore(data);
            // 任务调度相关
            case 'scheduler.add':
                return await this.handleSchedulerAdd(data);
            case 'scheduler.remove':
                return await this.handleSchedulerRemove(data);
            case 'scheduler.list':
                return await this.handleSchedulerList();
            // 用户管理相关
            case 'user.info':
                return await this.handleUserInfo(data);
            case 'user.list':
                return await this.handleUserList(data);
            case 'user.ban':
                return await this.handleUserBan(data);
            case 'user.unban':
                return await this.handleUserUnban(data);
            // 群组管理相关
            case 'group.info':
                return await this.handleGroupInfo(data);
            case 'group.list':
                return await this.handleGroupList();
            case 'group.members':
                return await this.handleGroupMembers(data);
            case 'group.kick':
                return await this.handleGroupKick(data);
            case 'group.mute':
                return await this.handleGroupMute(data);
            case 'group.unmute':
                return await this.handleGroupUnmute(data);
            // AI相关
            case 'ai.chat':
                return await this.handleAIChat(data);
            case 'ai.image':
                return await this.handleAIImage(data);
            case 'ai.translate':
                return await this.handleAITranslate(data);
            // 媒体处理相关
            case 'media.convert':
                return await this.handleMediaConvert(data);
            case 'media.compress':
                return await this.handleMediaCompress(data);
            case 'media.info':
                return await this.handleMediaInfo(data);
            // 时间相关（已迁移到 TimeManager 和 actionMap）
            default:
                throw new Error(`未知的动作: ${action}`);
        }
    }
    // Bot控制方法
    async handleBotRestart(data) {
        this.checkPermission('allowRestart');
        const { force = false, delay = 1000 } = data || {};
        logger.info('[MCP Handler] 执行Bot重启', { force, delay });
        // 记录重启日志
        this.captureLog('info', ['[MCP] Bot重启请求', { force, delay, timestamp: new Date().toISOString() }]);
        // 统一延迟两秒重启
        setTimeout(() => {
            process.exit(0);
        }, 2000);
        return {
            message: `Bot重启命令已发送`,
            delay,
            force,
            timestamp: Date.now(),
            debug: 'modified_version_test'
        };
    }
    // handleBotShutdown 已迁移到 BotManager
    async handleBotStatus() {
        try {
            // 获取基本信息
            const startTime = Bot.stat?.start_time * 1000 || Date.now();
            const uptime = Date.now() - startTime;
            // 获取渲染后端信息
            const renderers = this.getRendererInfo();
            // 获取数据库信息
            const databases = this.getDatabaseInfo();
            // 获取服务器信息
            const servers = this.getServerInfo();
            // 获取路由信息
            const routes = this.getRouteInfo();
            // 获取插件信息
            const plugins = this.getPluginInfo();
            // 获取定时任务信息
            const scheduledTasks = this.getScheduledTaskInfo();
            // 获取事件处理器信息
            const handlers = this.getHandlerInfo();
            // 获取监听事件信息
            const listeners = this.getListenerInfo();
            // 获取适配器信息
            const adapters = this.getAdapterInfo();
            // 获取账号信息
            const accounts = this.getAccountInfo();
            // 获取全局变量信息
            const globals = this.getGlobalVariableInfo();
            return {
                success: true,
                action: 'bot.status',
                data: {
                    // 基本状态
                    online: Object.keys(Bot.bots).length > 0,
                    uptime: uptime,
                    startTime: startTime,
                    // 系统信息
                    system: {
                        platform: process.platform,
                        arch: process.arch,
                        nodeVersion: process.version,
                        memory: process.memoryUsage(),
                        pid: process.pid,
                        cwd: process.cwd()
                    },
                    // 渲染后端
                    renderers: renderers,
                    // 数据库
                    databases: databases,
                    // 服务器
                    servers: servers,
                    // 路由
                    routes: routes,
                    // 插件
                    plugins: plugins,
                    // 定时任务
                    scheduledTasks: scheduledTasks,
                    // 事件处理器
                    handlers: handlers,
                    // 监听事件
                    listeners: listeners,
                    // 适配器
                    adapters: adapters,
                    // 账号
                    accounts: accounts,
                    // 全局变量
                    globals: globals
                },
                timestamp: Date.now(),
                responseTime: 1
            };
        }
        catch (error) {
            logger.error('[MCP Handler] 获取Bot状态失败:', error);
            return {
                success: false,
                action: 'bot.status',
                error: error.message,
                timestamp: Date.now()
            };
        }
    }
    // 获取渲染后端信息
    getRendererInfo() {
        try {
            const renderers = [];
            // 检查 puppeteer 渲染器
            if (global.renderer) {
                renderers.push({
                    name: 'puppeteer',
                    type: 'browser',
                    status: 'active',
                    config: {
                        headless: global.renderer.headless || 'unknown',
                        viewport: global.renderer.viewport || 'unknown'
                    }
                });
            }
            // 检查其他可能的渲染器
            if (global.Bot?.renderer) {
                renderers.push({
                    name: 'bot-renderer',
                    type: 'integrated',
                    status: 'active'
                });
            }
            return {
                count: renderers.length,
                active: renderers.filter(r => r.status === 'active').length,
                list: renderers
            };
        }
        catch (error) {
            return { error: error.message, count: 0, active: 0, list: [] };
        }
    }
    // 获取数据库信息
    getDatabaseInfo() {
        try {
            const databases = [];
            // 检查 Redis
            if (global.redis) {
                databases.push({
                    name: 'Redis',
                    type: 'cache',
                    status: global.redis.status || 'unknown',
                    config: {
                        host: global.redis.options?.host || 'unknown',
                        port: global.redis.options?.port || 'unknown',
                        db: global.redis.options?.db || 0
                    }
                });
            }
            // 检查其他数据库连接
            if (global.Bot?.redis) {
                databases.push({
                    name: 'Bot-Redis',
                    type: 'cache',
                    status: 'active'
                });
            }
            return {
                count: databases.length,
                active: databases.filter(db => db.status === 'active' || db.status === 'ready').length,
                list: databases
            };
        }
        catch (error) {
            return { error: error.message, count: 0, active: 0, list: [] };
        }
    }
    // 获取服务器信息
    getServerInfo() {
        try {
            const servers = [];
            // 检查 HTTP 服务器
            if (global.Bot?.express) {
                servers.push({
                    name: 'Express HTTP Server',
                    type: 'http',
                    status: 'active',
                    port: global.Bot.express.get('port') || 'unknown'
                });
            }
            // 检查 WebSocket 服务器
            if (global.Bot?.ws) {
                servers.push({
                    name: 'WebSocket Server',
                    type: 'websocket',
                    status: 'active'
                });
            }
            // 检查 MCP 服务器
            if (this.config?.mcp?.server?.enabled) {
                servers.push({
                    name: 'MCP Server',
                    type: 'mcp',
                    status: 'active',
                    path: this.config.mcp.server.path || '/MCP'
                });
            }
            return {
                count: servers.length,
                active: servers.filter(s => s.status === 'active').length,
                list: servers
            };
        }
        catch (error) {
            return { error: error.message, count: 0, active: 0, list: [] };
        }
    }
    // 获取路由信息
    getRouteInfo() {
        try {
            const routes = [];
            // 检查 Express 路由
            if (global.Bot?.express?._router) {
                const router = global.Bot.express._router;
                if (router.stack) {
                    router.stack.forEach(layer => {
                        if (layer.route) {
                            routes.push({
                                path: layer.route.path,
                                methods: Object.keys(layer.route.methods),
                                type: 'express'
                            });
                        }
                    });
                }
            }
            // 检查 MCP 路由
            routes.push({
                path: this.config?.mcp?.server?.path || '/MCP',
                methods: ['GET', 'POST', 'WS'],
                type: 'mcp'
            });
            return {
                count: routes.length,
                list: routes
            };
        }
        catch (error) {
            return { error: error.message, count: 0, list: [] };
        }
    }
    // 获取插件信息
    getPluginInfo() {
        try {
            const plugins = [];
            // 检查已加载的插件
            if (global.Bot?.PluginLoader?.pluginList) {
                for (const [name, plugin] of Object.entries(global.Bot.PluginLoader.pluginList)) {
                    plugins.push({
                        name: name,
                        path: plugin.path || 'unknown',
                        enabled: plugin.enabled !== false,
                        type: plugin.type || 'unknown',
                        priority: plugin.priority || 0
                    });
                }
            }
            // 检查 Yunzai 插件目录
            if (global.Bot?.plugins) {
                for (const [name, plugin] of Object.entries(global.Bot.plugins)) {
                    if (!plugins.find(p => p.name === name)) {
                        plugins.push({
                            name: name,
                            enabled: true,
                            type: 'yunzai',
                            loaded: true
                        });
                    }
                }
            }
            return {
                count: plugins.length,
                enabled: plugins.filter(p => p.enabled).length,
                disabled: plugins.filter(p => !p.enabled).length,
                list: plugins
            };
        }
        catch (error) {
            return { error: error.message, count: 0, enabled: 0, disabled: 0, list: [] };
        }
    }
    // 获取定时任务信息
    getScheduledTaskInfo() {
        try {
            const tasks = [];
            // 检查 node-cron 任务
            if (global.Bot?.cron) {
                // 这里需要根据实际的定时任务实现来获取信息
                tasks.push({
                    name: 'Bot Cron Tasks',
                    type: 'cron',
                    status: 'active'
                });
            }
            // 检查 setTimeout/setInterval
            const timers = process._getActiveHandles().filter(handle => handle.constructor.name === 'Timeout' || handle.constructor.name === 'Timer');
            return {
                count: tasks.length,
                active: tasks.filter(t => t.status === 'active').length,
                timers: timers.length,
                list: tasks
            };
        }
        catch (error) {
            return { error: error.message, count: 0, active: 0, timers: 0, list: [] };
        }
    }
    async handleBotInfo() {
        const botInfo = {};
        for (const [uin, bot] of Object.entries(Bot.bots)) {
            botInfo[uin] = {
                uin: bot.uin,
                nickname: bot.nickname,
                status: bot.status,
                friendCount: bot.fl?.size || 0,
                groupCount: bot.gl?.size || 0
            };
        }
        return botInfo;
    }
    // 获取事件处理器信息
    getHandlerInfo() {
        try {
            const handlers = [];
            // 检查 Bot 事件处理器
            if (global.Bot?._events) {
                for (const [event, listeners] of Object.entries(global.Bot._events)) {
                    const listenerCount = Array.isArray(listeners) ? listeners.length : 1;
                    handlers.push({
                        event: event,
                        listenerCount: listenerCount,
                        type: 'bot'
                    });
                }
            }
            // 检查 MCP 事件处理器
            if (this.eventListeners) {
                for (const [event, listeners] of this.eventListeners.entries()) {
                    handlers.push({
                        event: event,
                        listenerCount: listeners.size,
                        type: 'mcp'
                    });
                }
            }
            return {
                count: handlers.length,
                totalListeners: handlers.reduce((sum, h) => sum + h.listenerCount, 0),
                list: handlers
            };
        }
        catch (error) {
            return { error: error.message, count: 0, totalListeners: 0, list: [] };
        }
    }
    // 获取监听事件信息
    getListenerInfo() {
        try {
            const listeners = [];
            // 检查进程事件监听器
            const processEvents = ['exit', 'SIGINT', 'SIGTERM', 'uncaughtException', 'unhandledRejection'];
            processEvents.forEach(event => {
                const count = process.listenerCount(event);
                if (count > 0) {
                    listeners.push({
                        target: 'process',
                        event: event,
                        count: count
                    });
                }
            });
            // 检查 Bot 事件监听器
            if (global.Bot) {
                const botEvents = ['message', 'notice', 'request', 'system'];
                botEvents.forEach(event => {
                    const count = global.Bot.listenerCount ? global.Bot.listenerCount(event) : 0;
                    if (count > 0) {
                        listeners.push({
                            target: 'bot',
                            event: event,
                            count: count
                        });
                    }
                });
            }
            return {
                count: listeners.length,
                totalListeners: listeners.reduce((sum, l) => sum + l.count, 0),
                list: listeners
            };
        }
        catch (error) {
            return { error: error.message, count: 0, totalListeners: 0, list: [] };
        }
    }
    // 获取适配器信息
    getAdapterInfo() {
        try {
            const adapters = [];
            const connectedBots = [];
            // 检查已注册的适配器
            if (Bot.adapter && Array.isArray(Bot.adapter)) {
                for (const adapter of Bot.adapter) {
                    adapters.push({
                        id: adapter.id || 'unknown',
                        name: adapter.name || 'unknown',
                        path: adapter.path || 'unknown',
                        type: 'registered',
                        status: 'loaded'
                    });
                }
            }
            // 检查已连接的 Bot 实例
            if (Bot.bots && typeof Bot.bots === 'object') {
                for (const [uin, bot] of Object.entries(Bot.bots)) {
                    // 过滤掉非数字的键（避免获取到 Bot 对象的其他属性）
                    if (uin && !isNaN(uin)) {
                        connectedBots.push({
                            uin: uin,
                            adapter: bot.adapter?.name || bot.adapter?.id || 'unknown',
                            adapterId: bot.adapter?.id || 'unknown',
                            status: bot.status || 'unknown',
                            nickname: bot.nickname || 'unknown',
                            platform: bot.platform || 'unknown',
                            friendCount: bot.fl?.size || 0,
                            groupCount: bot.gl?.size || 0
                        });
                    }
                }
            }
            return {
                adapters: {
                    count: adapters.length,
                    list: adapters
                },
                bots: {
                    count: connectedBots.length,
                    online: connectedBots.filter(b => b.status === 'online').length,
                    offline: connectedBots.filter(b => b.status === 'offline').length,
                    list: connectedBots
                },
                summary: {
                    totalAdapters: adapters.length,
                    totalBots: connectedBots.length,
                    onlineBots: connectedBots.filter(b => b.status === 'online').length
                }
            };
        }
        catch (error) {
            return {
                error: error.message,
                adapters: { count: 0, list: [] },
                bots: { count: 0, online: 0, offline: 0, list: [] },
                summary: { totalAdapters: 0, totalBots: 0, onlineBots: 0 }
            };
        }
    }
    // 获取账号信息
    getAccountInfo() {
        try {
            const accounts = [];
            for (const [uin, bot] of Object.entries(Bot.bots || {})) {
                accounts.push({
                    uin: uin,
                    nickname: bot.nickname || 'unknown',
                    status: bot.status || 'unknown',
                    friendCount: bot.fl?.size || 0,
                    groupCount: bot.gl?.size || 0,
                    avatar: bot.avatar || null,
                    level: bot.level || 0
                });
            }
            return {
                count: accounts.length,
                online: accounts.filter(a => a.status === 'online').length,
                totalFriends: accounts.reduce((sum, a) => sum + a.friendCount, 0),
                totalGroups: accounts.reduce((sum, a) => sum + a.groupCount, 0),
                list: accounts
            };
        }
        catch (error) {
            return { error: error.message, count: 0, online: 0, totalFriends: 0, totalGroups: 0, list: [] };
        }
    }
    // 获取全局变量信息
    getGlobalVariableInfo() {
        try {
            const globals = {};
            const allGlobals = {};
            // 获取所有全局变量
            for (const key of Object.keys(global)) {
                const value = global[key];
                allGlobals[key] = {
                    exists: true,
                    type: typeof value,
                    isFunction: typeof value === 'function',
                    isObject: typeof value === 'object' && value !== null,
                    isArray: Array.isArray(value),
                    constructor: value?.constructor?.name || 'unknown',
                    // 对于对象，尝试获取一些基本信息
                    info: this.getVariableInfo(value)
                };
            }
            // 检查重要的全局变量
            const importantGlobals = [
                'Bot', 'redis', 'renderer', 'logger', 'segment', 'plugin',
                'scheduledTasks', 'bannedUsers', 'messageMap'
            ];
            importantGlobals.forEach(name => {
                globals[name] = {
                    exists: typeof global[name] !== 'undefined',
                    type: typeof global[name],
                    isFunction: typeof global[name] === 'function',
                    isObject: typeof global[name] === 'object' && global[name] !== null,
                    info: this.getVariableInfo(global[name])
                };
            });
            // 检查环境变量
            const envVars = {
                NODE_ENV: process.env.NODE_ENV || 'unknown',
                NODE_VERSION: process.version,
                PLATFORM: process.platform,
                ARCH: process.arch,
                TZ: process.env.TZ || 'unknown'
            };
            return {
                important: globals,
                all: allGlobals,
                environment: envVars,
                globalCount: Object.keys(global).length,
                envCount: Object.keys(process.env).length,
                globalKeys: Object.keys(global).sort()
            };
        }
        catch (error) {
            return { error: error.message, important: {}, all: {}, environment: {}, globalCount: 0, envCount: 0, globalKeys: [] };
        }
    }
    // 获取变量的详细信息
    getVariableInfo(value) {
        try {
            if (value === null)
                return 'null';
            if (value === undefined)
                return 'undefined';
            const type = typeof value;
            if (type === 'function') {
                return {
                    type: 'function',
                    name: value.name || 'anonymous',
                    length: value.length
                };
            }
            if (type === 'object') {
                if (Array.isArray(value)) {
                    return {
                        type: 'array',
                        length: value.length
                    };
                }
                if (value instanceof Map) {
                    return {
                        type: 'Map',
                        size: value.size
                    };
                }
                if (value instanceof Set) {
                    return {
                        type: 'Set',
                        size: value.size
                    };
                }
                // 普通对象
                const keys = Object.keys(value);
                return {
                    type: 'object',
                    constructor: value.constructor?.name || 'Object',
                    keyCount: keys.length,
                    keys: keys.slice(0, 10) // 只显示前10个键
                };
            }
            if (type === 'string') {
                return {
                    type: 'string',
                    length: value.length,
                    preview: value.length > 50 ? value.substring(0, 50) + '...' : value
                };
            }
            if (type === 'number') {
                return {
                    type: 'number',
                    value: value
                };
            }
            if (type === 'boolean') {
                return {
                    type: 'boolean',
                    value: value
                };
            }
            return {
                type: type,
                value: String(value)
            };
        }
        catch (error) {
            return { error: error.message };
        }
    }
    // 消息相关方法
    /**
     * 解析消息格式，参考OneBotv11适配器的parseMsg方法
     * @param {Array|Object} msg 消息内容
     * @returns {Array} 解析后的消息数组
     */
    parseMessage(msg) {
        const array = [];
        for (const i of Array.isArray(msg) ? msg : [msg]) {
            if (typeof i === "object" && i.type) {
                array.push({ ...i.data, type: i.type });
            }
            else {
                array.push({ type: "text", text: String(i) });
            }
        }
        return array;
    }
    /**
     * 构建消息格式，参考OneBotv11适配器的makeMsg方法
     * @param {Array|Object|String} msg 原始消息
     * @returns {Array} 格式化后的消息数组
     */
    async makeMessage(msg) {
        if (!Array.isArray(msg)) {
            msg = [msg];
        }
        const msgs = [];
        const forward = [];
        for (let i of msg) {
            if (typeof i !== "object") {
                i = { type: "text", data: { text: i } };
            }
            else if (!i.data) {
                i = { type: i.type, data: { ...i, type: undefined } };
            }
            switch (i.type) {
                case "at":
                    i.data.qq = String(i.data.qq);
                    break;
                case "reply":
                    i.data.id = String(i.data.id);
                    break;
                case "button":
                    continue;
                case "node":
                    forward.push(...i.data);
                    continue;
                case "raw":
                    i = i.data;
                    break;
                case "image":
                case "record":
                case "video":
                case "file":
                    if (i.data.file) {
                        // 处理文件类型消息，可以在这里添加文件处理逻辑
                        // 暂时保持原样
                    }
                    break;
            }
            msgs.push(i);
        }
        return [msgs, forward];
    }
    /**
     * 发送消息的核心方法
     * @param {Array|Object|String} msg 消息内容
     * @param {Function} send 发送函数
     * @param {Function} sendForwardMsg 转发消息函数
     * @returns {Object} 发送结果
     */
    async sendMessage(msg, send, sendForwardMsg) {
        const [message, forward] = await this.makeMessage(msg);
        const ret = [];
        if (forward.length) {
            const data = await sendForwardMsg(forward);
            if (Array.isArray(data)) {
                ret.push(...data);
            }
            else {
                ret.push(data);
            }
        }
        if (message.length) {
            ret.push(await send(message));
        }
        if (ret.length === 1)
            return ret[0];
        const message_id = [];
        for (const i of ret) {
            if (i?.message_id) {
                message_id.push(i.message_id);
            }
        }
        return { data: ret, message_id };
    }
    /**
     * 发送好友消息
     * @param {Object} data 消息数据
     * @returns {Object} 发送结果
     */
    async sendFriendMessage(data) {
        this.checkPermission('allowSendMessage');
        const { user_id, message, bot_id } = data;
        if (!user_id || !message) {
            throw new Error('缺少必要参数: user_id 和 message');
        }
        const bot = bot_id ? Bot.bots[bot_id] : Object.values(Bot.bots)[0];
        if (!bot) {
            throw new Error('未找到可用的Bot实例');
        }
        const friend = bot.pickFriend(user_id);
        const result = await this.sendMessage(message, (msg) => friend.sendMsg(msg), (forwardMsg) => friend.sendForwardMsg(forwardMsg));
        logger.info(`[MCP] 发送好友消息: ${bot.uin} => ${user_id}`);
        return {
            success: true,
            messageId: result.message_id || result.data?.[0]?.message_id,
            timestamp: Date.now(),
            type: 'private',
            target: user_id
        };
    }
    /**
     * 发送群消息
     * @param {Object} data 消息数据
     * @returns {Object} 发送结果
     */
    async sendGroupMessage(data) {
        this.checkPermission('allowSendMessage');
        const { group_id, message, bot_id } = data;
        if (!group_id || !message) {
            throw new Error('缺少必要参数: group_id 和 message');
        }
        const bot = bot_id ? Bot.bots[bot_id] : Object.values(Bot.bots)[0];
        if (!bot) {
            throw new Error('未找到可用的Bot实例');
        }
        const group = bot.pickGroup(group_id);
        const result = await this.sendMessage(message, (msg) => group.sendMsg(msg), (forwardMsg) => group.sendForwardMsg(forwardMsg));
        logger.info(`[MCP] 发送群消息: ${bot.uin} => ${group_id}`);
        return {
            success: true,
            messageId: result.message_id || result.data?.[0]?.message_id,
            timestamp: Date.now(),
            type: 'group',
            target: group_id
        };
    }
    /**
     * 发送好友消息
     * @param {Object} data 消息数据
     * @returns {Object} 发送结果
     */
    async handleSendFriendMessage(data) {
        return await this.sendFriendMessage(data);
    }
    /**
     * 发送群消息
     * @param {Object} data 消息数据
     * @returns {Object} 发送结果
     */
    async handleSendGroupMessage(data) {
        return await this.sendGroupMessage(data);
    }
    /**
     * 统一的发送消息接口（兼容旧版本）
     * @param {Object} data 消息数据
     * @returns {Object} 发送结果
     */
    async handleSendMessage(data) {
        const { target, message, type = 'private', user_id, group_id, bot_id } = data;
        // 兼容新旧参数格式
        if (type === 'private' || user_id) {
            return await this.sendFriendMessage({
                user_id: user_id || target,
                message,
                bot_id
            });
        }
        else if (type === 'group' || group_id) {
            return await this.sendGroupMessage({
                group_id: group_id || target,
                message,
                bot_id
            });
        }
        else {
            throw new Error('无效的消息类型，支持: private, group');
        }
    }
    /**
     * 撤回消息
     * @param {Object} data 撤回数据
     * @returns {Object} 撤回结果
     */
    async handleRecallMessage(data) {
        this.checkPermission('allowSendMessage');
        const { messageId, message_id, target, type = 'private', user_id, group_id, bot_id } = data;
        const msgId = messageId || message_id;
        if (!msgId) {
            throw new Error('缺少必要参数: messageId 或 message_id');
        }
        const bot = bot_id ? Bot.bots[bot_id] : Object.values(Bot.bots)[0];
        if (!bot) {
            throw new Error('未找到可用的Bot实例');
        }
        let result;
        if (type === 'private' || user_id) {
            const friend = bot.pickFriend(user_id || target);
            result = await friend.recallMsg(msgId);
            logger.info(`[MCP] 撤回好友消息: ${bot.uin} => ${user_id || target}, ${msgId}`);
        }
        else if (type === 'group' || group_id) {
            const group = bot.pickGroup(group_id || target);
            result = await group.recallMsg(msgId);
            logger.info(`[MCP] 撤回群消息: ${bot.uin} => ${group_id || target}, ${msgId}`);
        }
        else {
            throw new Error('无效的消息类型，支持: private, group');
        }
        return {
            success: true,
            messageId: msgId,
            result,
            timestamp: Date.now()
        };
    }
    /**
     * 获取消息历史记录
     * @param {Object} data 查询数据
     * @returns {Object} 历史记录
     */
    async handleMessageHistory(data) {
        this.checkPermission('allowReceiveMessage');
        const { target, type = 'private', count = 20, message_seq, user_id, group_id, bot_id } = data;
        const bot = bot_id ? Bot.bots[bot_id] : Object.values(Bot.bots)[0];
        if (!bot) {
            throw new Error('未找到可用的Bot实例');
        }
        let history;
        try {
            if (type === 'private' || user_id) {
                const targetId = user_id || target;
                if (bot.adapter?.getFriendMsgHistory) {
                    history = await bot.adapter.getFriendMsgHistory({
                        bot,
                        user_id: targetId
                    }, message_seq || 0, count);
                }
                else {
                    // 如果适配器不支持历史记录，返回空数组
                    history = [];
                }
                logger.info(`[MCP] 获取好友消息历史: ${bot.uin} => ${targetId}`);
            }
            else if (type === 'group' || group_id) {
                const targetId = group_id || target;
                if (bot.adapter?.getGroupMsgHistory) {
                    history = await bot.adapter.getGroupMsgHistory({
                        bot,
                        group_id: targetId
                    }, message_seq || 0, count);
                }
                else {
                    // 如果适配器不支持历史记录，返回空数组
                    history = [];
                }
                logger.info(`[MCP] 获取群消息历史: ${bot.uin} => ${targetId}`);
            }
            else {
                throw new Error('无效的消息类型，支持: private, group');
            }
        }
        catch (error) {
            logger.error(`[MCP] 获取消息历史失败: ${error.message}`);
            history = [];
        }
        return {
            history: history || [],
            count: history?.length || 0,
            type,
            target: user_id || group_id || target,
            timestamp: Date.now()
        };
    }
    /**
     * 获取指定消息详情
     * @param {Object} data 查询数据
     * @returns {Object} 消息详情
     */
    async handleGetMessage(data) {
        this.checkPermission('allowReceiveMessage');
        const { messageId, message_id, bot_id } = data;
        const msgId = messageId || message_id;
        if (!msgId) {
            throw new Error('缺少必要参数: messageId 或 message_id');
        }
        const bot = bot_id ? Bot.bots[bot_id] : Object.values(Bot.bots)[0];
        if (!bot) {
            throw new Error('未找到可用的Bot实例');
        }
        try {
            let message;
            if (bot.adapter?.getMsg) {
                message = await bot.adapter.getMsg({ bot }, msgId);
            }
            else {
                throw new Error('当前适配器不支持获取消息详情');
            }
            logger.info(`[MCP] 获取消息详情: ${bot.uin} => ${msgId}`);
            return {
                success: true,
                message,
                messageId: msgId,
                timestamp: Date.now()
            };
        }
        catch (error) {
            logger.error(`[MCP] 获取消息详情失败: ${error.message}`);
            return {
                success: false,
                error: error.message,
                messageId: msgId,
                timestamp: Date.now()
            };
        }
    }
    /**
     * 获取转发消息内容
     * @param {Object} data 查询数据
     * @returns {Object} 转发消息内容
     */
    async handleGetForwardMessage(data) {
        this.checkPermission('allowReceiveMessage');
        const { messageId, message_id, bot_id } = data;
        const msgId = messageId || message_id;
        if (!msgId) {
            throw new Error('缺少必要参数: messageId 或 message_id');
        }
        const bot = bot_id ? Bot.bots[bot_id] : Object.values(Bot.bots)[0];
        if (!bot) {
            throw new Error('未找到可用的Bot实例');
        }
        try {
            let forwardMsg;
            if (bot.adapter?.getForwardMsg) {
                forwardMsg = await bot.adapter.getForwardMsg({ bot }, msgId);
            }
            else {
                throw new Error('当前适配器不支持获取转发消息');
            }
            logger.info(`[MCP] 获取转发消息: ${bot.uin} => ${msgId}`);
            return {
                success: true,
                forwardMsg,
                messageId: msgId,
                timestamp: Date.now()
            };
        }
        catch (error) {
            logger.error(`[MCP] 获取转发消息失败: ${error.message}`);
            return {
                success: false,
                error: error.message,
                messageId: msgId,
                timestamp: Date.now()
            };
        }
    }
    // Redis相关方法
    async handleRedisGet(data) {
        this.checkPermission('allowRedis');
        const { key } = data;
        if (!key)
            throw new Error('缺少参数: key');
        const value = await redis.get(key);
        return { key, value, timestamp: Date.now() };
    }
    async handleRedisSet(data) {
        this.checkPermission('allowRedis');
        const { key, value, expire } = data;
        if (!key || value === undefined) {
            throw new Error('缺少参数: key 和 value');
        }
        if (expire) {
            await redis.setEx(key, expire, value);
        }
        else {
            await redis.set(key, value);
        }
        return { success: true, key, timestamp: Date.now() };
    }
    async handleRedisDel(data) {
        this.checkPermission('allowRedis');
        const { key } = data;
        if (!key)
            throw new Error('缺少参数: key');
        const result = await redis.del(key);
        return { deleted: result, key, timestamp: Date.now() };
    }
    async handleRedisKeys(data) {
        this.checkPermission('allowRedis');
        const { pattern = '*' } = data;
        const keys = await redis.keys(pattern);
        return { keys, pattern, count: keys.length, timestamp: Date.now() };
    }
    async handleRedisInfo() {
        this.checkPermission('allowRedis');
        const info = await redis.info();
        return { info, timestamp: Date.now() };
    }
    // 插件相关方法
    async handlePluginList() {
        this.checkPermission('allowPluginAccess');
        const plugins = [];
        // 获取插件信息（这里需要根据实际的插件管理器实现）
        // 暂时返回基本信息
        return {
            plugins,
            count: plugins.length,
            timestamp: Date.now()
        };
    }
    async handlePluginInfo(data) {
        this.checkPermission('allowPluginAccess');
        const { pluginName } = data;
        if (!pluginName)
            throw new Error('缺少参数: pluginName');
        // 获取特定插件信息
        return {
            name: pluginName,
            // 其他插件信息
            timestamp: Date.now()
        };
    }
    // 文件操作方法
    async handleFileRead(data) {
        this.checkPermission('allowFileOperations');
        const { filePath, encoding = 'utf8' } = data;
        if (!filePath)
            throw new Error('缺少参数: filePath');
        const content = await fs.readFile(filePath, encoding);
        return {
            filePath,
            content,
            size: content.length,
            timestamp: Date.now()
        };
    }
    async handleFileWrite(data) {
        this.checkPermission('allowFileOperations');
        const { filePath, content, encoding = 'utf8' } = data;
        if (!filePath || content === undefined) {
            throw new Error('缺少参数: filePath 和 content');
        }
        await fs.writeFile(filePath, content, encoding);
        return {
            success: true,
            filePath,
            size: content.length,
            timestamp: Date.now()
        };
    }
    async handleFileList(data) {
        this.checkPermission('allowFileOperations');
        const { dirPath = './' } = data;
        const files = await fs.readdir(dirPath, { withFileTypes: true });
        const fileList = files.map(file => ({
            name: file.name,
            isDirectory: file.isDirectory(),
            isFile: file.isFile()
        }));
        return {
            dirPath,
            files: fileList,
            count: fileList.length,
            timestamp: Date.now()
        };
    }
    async handleFileDelete(data) {
        this.checkPermission('allowFileOperations');
        const { filePath } = data;
        if (!filePath)
            throw new Error('缺少参数: filePath');
        await fs.unlink(filePath);
        return {
            success: true,
            filePath,
            timestamp: Date.now()
        };
    }
    // 命令执行方法
    async handleCommandExecute(data) {
        this.checkPermission('allowCommandExecution');
        const { command, cwd } = data;
        if (!command)
            throw new Error('缺少参数: command');
        const options = {};
        if (cwd)
            options.cwd = cwd;
        const { stdout, stderr } = await execAsync(command, options);
        return {
            command,
            stdout,
            stderr,
            timestamp: Date.now()
        };
    }
    // 测试方法
    async handleTestEvent(data) {
        const { eventType, eventData } = data;
        // 模拟事件
        Bot.emit(eventType, eventData);
        return {
            success: true,
            eventType,
            eventData,
            timestamp: Date.now()
        };
    }
    async handleTestMessage(data) {
        const { message, user_id, sender } = data;
        // 使用提供的 user_id，如果没有则使用 'mcp_test_user'
        let userId = user_id || sender || 'mcp_test_user';
        // 确保 userId 是字符串且不为空
        if (!userId || userId === 'undefined') {
            userId = 'mcp_test_user';
        }
        // 检查Bot对象
        // 确保Bot对象存在
        if (!Bot || typeof Bot !== 'object') {
            throw new Error(`Bot对象不可用或未正确初始化。Bot类型: ${typeof Bot}`);
        }
        // 获取第一个可用的Bot实例
        let self_id = 'stdin'; // 默认使用 stdin 适配器
        let bot = Bot.stdin;
        // 如果有其他可用的Bot实例，优先使用
        if (Bot.uin && Array.isArray(Bot.uin) && Bot.uin.length > 0) {
            self_id = Bot.uin[0];
            bot = Bot[self_id];
        }
        else if (Bot.bots && Object.keys(Bot.bots).length > 0) {
            // 从 Bot.bots 中获取第一个可用的Bot
            const botKeys = Object.keys(Bot.bots);
            self_id = botKeys[0];
            bot = Bot.bots[self_id];
        }
        if (!bot) {
            throw new Error(`找不到Bot实例: ${self_id}`);
        }
        // 确保bot是一个对象而不是字符串
        if (typeof bot === 'string') {
            throw new Error(`Bot实例是字符串而不是对象: ${bot}`);
        }
        // 创建测试消息事件，完全模拟OneBotv11适配器的消息结构
        const testEvent = {
            post_type: 'message',
            message_type: 'private',
            sub_type: 'friend',
            message_id: Date.now(),
            user_id: userId,
            self_id: self_id,
            message: [{ type: 'text', text: message }],
            raw_message: message,
            font: 0,
            sender: {
                user_id: userId,
                nickname: 'MCP测试用户',
                sex: 'unknown',
                age: 0
            },
            time: Math.floor(Date.now() / 1000),
            bot: bot,
            raw: `{"post_type":"message","message_type":"private","sub_type":"friend","message_id":${Date.now()},"user_id":"${userId}","message":[{"type":"text","text":"${message}"}],"raw_message":"${message}","font":0,"sender":{"user_id":"${userId}","nickname":"MCP测试用户","sex":"unknown","age":0},"time":${Math.floor(Date.now() / 1000)},"self_id":"${self_id}"}`
        };
        // 添加适配器方法 - 模拟OneBotv11适配器的pickFriend方法
        const mockAdapter = {
            sendFriendMsg: async (data, msg) => {
                // 异步处理图片URL获取并输出详细日志
                const formatMessage = async (item) => {
                    if (typeof item === 'string') {
                        return item;
                    }
                    if (typeof item === 'object' && item !== null) {
                        if (item.type === 'image') {
                            let imageInfo = `[图片]`;
                            let resolutionInfo = '';
                            // 获取图片分辨率信息
                            try {
                                const resolution = await this.getImageResolution(item.file || item.url);
                                if (resolution) {
                                    resolutionInfo = `\n分辨率: ${logger.yellow(resolution.width + 'x' + resolution.height)} (${resolution.type})`;
                                }
                            }
                            catch (error) {
                                // 静默处理分辨率获取错误
                            }
                            if (item.file) {
                                // 如果有文件路径，显示路径信息
                                const fileStr = String(item.file);
                                // 检查是否是二进制数据（Buffer）
                                if (Buffer.isBuffer(item.file)) {
                                    // 使用 Bot.fileToUrl 注册文件到HTTP服务器并获取URL
                                    const fileName = item.name || `image-${Date.now()}.jpg`;
                                    const filePath = `data/mcp_client/${fileName}`;
                                    try {
                                        // 等待获取真实的URL
                                        const fileUrl = await Bot.fileToUrl(item.file, { name: fileName });
                                        imageInfo = `发送图片: Buffer\n路径: ${logger.cyan(filePath)}\n网址: ${logger.green(fileUrl)}${resolutionInfo}`;
                                        // 异步保存文件到磁盘（静默处理，不打印日志）
                                        this.saveImageFileQuietly(item.file, filePath).catch(err => {
                                            logger.error('[MCP] 保存图片文件失败:', err);
                                        });
                                    }
                                    catch (error) {
                                        imageInfo = `发送图片: Buffer\n路径: ${logger.cyan(filePath)}\n网址: ${logger.red('注册失败')}${resolutionInfo}`;
                                    }
                                }
                                else if (fileStr.startsWith('http')) {
                                    imageInfo = `发送图片: 网址: ${logger.green(fileStr)}${resolutionInfo}`;
                                }
                                else {
                                    imageInfo = `发送图片: 路径: ${logger.cyan(fileStr)}${resolutionInfo}`;
                                }
                            }
                            return imageInfo;
                        }
                        else if (item.type === 'text') {
                            return item.text || '[文本消息]';
                        }
                        else if (item.type === 'button') {
                            // 展开显示按钮详细信息，使用紧凑格式
                            return this.formatButtonMessage(item);
                        }
                        else if (item.type) {
                            return `[${item.type}消息]`;
                        }
                        else {
                            // 对于没有type的对象，检查是否包含二进制数据
                            const safeObj = {};
                            for (const [key, value] of Object.entries(item)) {
                                if (Buffer.isBuffer(value)) {
                                    safeObj[key] = `[Buffer ${value.length} 字节]`;
                                }
                                else if (typeof value === 'object' && value !== null) {
                                    safeObj[key] = '[Object]';
                                }
                                else {
                                    safeObj[key] = value;
                                }
                            }
                            return JSON.stringify(safeObj);
                        }
                    }
                    return String(item);
                };
                // 异步处理消息格式化并输出日志
                let logMsg;
                if (Array.isArray(msg)) {
                    const formattedMessages = await Promise.all(msg.map(formatMessage));
                    logMsg = formattedMessages.join('\n');
                }
                else if (typeof msg === 'object' && msg !== null) {
                    logMsg = await formatMessage(msg);
                }
                else {
                    logMsg = msg;
                }
                logger.info(`[MCP Test Reply] ${typeof logMsg === 'string' ? logMsg : JSON.stringify(logMsg)}`);
                // 避免直接输出可能包含二进制数据的原始消息
                if (Array.isArray(msg)) {
                    for (const item of msg) {
                        if (typeof item === 'object' && item !== null && Buffer.isBuffer(item.file)) {
                            // 如果消息包含二进制图片数据，不要直接输出
                            return Promise.resolve({ message_id: Date.now() });
                        }
                    }
                }
                return Promise.resolve({ message_id: Date.now() });
            },
            getMsg: (data, message_id) => {
                return Promise.resolve({ message_id, message: testEvent.message, raw_message: testEvent.raw_message });
            },
            recallMsg: (data, message_id) => {
                logger.info(`[MCP Mock] 撤回消息: ${message_id}`);
                return Promise.resolve({ message_id });
            },
            getFriendInfo: (data) => {
                return Promise.resolve({ user_id: data.user_id, nickname: 'MCP测试用户' });
            }
        };
        // 构造friend对象，模拟OneBotv11适配器的pickFriend返回值
        const friendData = {
            user_id: userId,
            nickname: 'MCP测试用户',
            bot: bot,
            self_id: self_id
        };
        testEvent.friend = {
            ...friendData,
            sendMsg: mockAdapter.sendFriendMsg.bind(mockAdapter, friendData),
            getMsg: mockAdapter.getMsg.bind(mockAdapter, friendData),
            recallMsg: mockAdapter.recallMsg.bind(mockAdapter, friendData),
            getInfo: mockAdapter.getFriendInfo.bind(mockAdapter, friendData),
            getAvatarUrl() { return `https://q.qlogo.cn/g?b=qq&s=0&nk=${userId}`; }
        };
        // 添加reply方法
        testEvent.reply = async (msg) => {
            // 记录响应到缓冲区
            const messageKey = `${userId}_${testEvent.message_id}`;
            if (this.messageResponseBuffer.has(messageKey)) {
                this.messageResponseBuffer.get(messageKey).responses.push({
                    type: 'reply',
                    content: msg,
                    timestamp: Date.now()
                });
            }
            // 不在这里打印日志，避免重复输出，详细日志会在 sendFriendMsg 中打印
            // 避免直接输出可能包含二进制数据的原始消息
            if (Array.isArray(msg)) {
                for (const item of msg) {
                    if (typeof item === 'object' && item !== null && Buffer.isBuffer(item.file)) {
                        // 如果消息包含二进制图片数据，不要直接输出到控制台
                        break;
                    }
                }
            }
            return testEvent.friend.sendMsg(msg);
        };
        // 确保bot对象有必要的属性（只有当bot是对象时才设置）
        if (typeof bot === 'object' && bot !== null) {
            if (!bot.fl)
                bot.fl = new Map();
            if (!bot.gl)
                bot.gl = new Map();
            if (!bot.gml)
                bot.gml = new Map();
        }
        // 添加测试用户到好友列表
        bot.fl.set(userId, {
            user_id: userId,
            nickname: 'MCP测试用户'
        });
        try {
            // 记录日志，模拟OneBotv11适配器的makeMessage方法
            Bot.makeLog("info", `好友消息：[MCP测试用户] ${message}`, `${self_id} <= ${userId}`, true);
            // 异步触发消息事件，避免阻塞MCP响应
            setImmediate(() => {
                try {
                    Bot.em('message.private.friend', testEvent);
                }
                catch (error) {
                    logger.error(`[MCP Handler] 异步消息处理失败: ${error.message}`);
                }
            });
            return {
                success: true,
                action: 'test.message',
                testEvent: {
                    message_type: testEvent.message_type,
                    user_id: testEvent.user_id,
                    message: testEvent.raw_message,
                    timestamp: testEvent.time,
                    self_id: testEvent.self_id
                }
            };
        }
        catch (error) {
            logger.error(`[MCP Handler] 测试消息处理失败: ${error.message}`);
            return {
                success: false,
                error: error.message,
                timestamp: Date.now()
            };
        }
    }
    // 调试方法
    async handleDebugLogs(data) {
        const { lines = 100 } = data;
        // 读取日志文件（需要根据实际日志文件路径调整）
        try {
            const logPath = './logs/error.log';
            const content = await fs.readFile(logPath, 'utf8');
            const logLines = content.split('\n').slice(-lines);
            return {
                logs: logLines,
                count: logLines.length,
                timestamp: Date.now()
            };
        }
        catch (error) {
            return {
                logs: [],
                error: error.message,
                timestamp: Date.now()
            };
        }
    }
    // handleGetLogs 已迁移到 LogManager
    // 新增：流式日志获取
    async handleStreamLogs(data) {
        const { follow = false, level = null, realtime = true } = data || {};
        if (!follow) {
            // 非跟随模式，返回当前日志
            return await this.logManager.getLogs(data);
        }
        // 跟随模式，设置实时日志推送
        const streamId = `log_stream_${Date.now()}`;
        // 这里可以实现WebSocket推送或者轮询机制
        // 暂时返回配置信息
        return {
            streamId,
            message: '日志流已启动',
            config: { follow, level, realtime },
            timestamp: Date.now()
        };
    }
    // handleClearLogs 已迁移到 LogManager
    // 新增：获取消息响应
    async handleGetMessageResponse(data) {
        const { messageId = null, userId = null, groupId = null, since = null, includeOriginal = true } = data || {};
        let responses = [];
        if (messageId) {
            // 根据消息ID查找
            for (const [key, responseData] of this.messageResponseBuffer.entries()) {
                if (responseData.originalMessage.message_id === messageId) {
                    responses.push({
                        key,
                        ...await this.sanitizeResponseData(responseData),
                        originalMessage: includeOriginal ? this.sanitizeMessageData(responseData.originalMessage) : undefined
                    });
                }
            }
        }
        else if (userId || groupId) {
            // 根据用户ID或群ID查找
            const targetId = userId || groupId;
            for (const [key, responseData] of this.messageResponseBuffer.entries()) {
                const msgUserId = responseData.originalMessage.user_id;
                const msgGroupId = responseData.originalMessage.group_id;
                if (msgUserId === targetId || msgGroupId === targetId) {
                    responses.push({
                        key,
                        ...await this.sanitizeResponseData(responseData),
                        originalMessage: includeOriginal ? this.sanitizeMessageData(responseData.originalMessage) : undefined
                    });
                }
            }
        }
        else {
            // 返回所有响应
            for (const [key, responseData] of this.messageResponseBuffer.entries()) {
                responses.push({
                    key,
                    ...await this.sanitizeResponseData(responseData),
                    originalMessage: includeOriginal ? this.sanitizeMessageData(responseData.originalMessage) : undefined
                });
            }
        }
        // 按时间过滤
        if (since) {
            const sinceTime = new Date(since).getTime();
            responses = responses.filter(response => response.timestamp >= sinceTime);
        }
        return {
            responses,
            count: responses.length,
            totalBuffered: this.messageResponseBuffer.size,
            filters: { messageId, userId, groupId, since },
            timestamp: Date.now()
        };
    }
    // 新增：清理响应数据，避免循环引用
    async sanitizeResponseData(responseData) {
        const sanitizedResponses = [];
        if (responseData.responses) {
            for (const response of responseData.responses) {
                sanitizedResponses.push({
                    type: response.type,
                    timestamp: response.timestamp,
                    content: await this.sanitizeContent(response.content)
                });
            }
        }
        return {
            timestamp: responseData.timestamp,
            responses: sanitizedResponses
        };
    }
    // 新增：清理消息数据，避免循环引用
    sanitizeMessageData(messageData) {
        if (!messageData)
            return null;
        return {
            message_id: messageData.message_id,
            user_id: messageData.user_id,
            group_id: messageData.group_id,
            message_type: messageData.message_type,
            message: messageData.message,
            timestamp: messageData.timestamp,
            self_id: messageData.self_id
        };
    }
    // 新增：清理内容数据，避免循环引用
    async sanitizeContent(content) {
        if (typeof content === 'string') {
            return content;
        }
        if (Array.isArray(content)) {
            const sanitizedArray = [];
            for (const item of content) {
                sanitizedArray.push(await this.sanitizeContent(item));
            }
            return sanitizedArray;
        }
        if (typeof content === 'object' && content !== null) {
            const sanitized = {};
            for (const [key, value] of Object.entries(content)) {
                // 跳过可能包含循环引用的属性
                if (key === 'runtime' || key === 'e' || key === 'bot' || key === 'friend' || key === 'group') {
                    continue;
                }
                if (typeof value === 'function') {
                    sanitized[key] = '[Function]';
                }
                else if (Buffer.isBuffer(value)) {
                    sanitized[key] = `[Buffer ${value.length} bytes]`;
                }
                else if (typeof value === 'object' && value !== null) {
                    // 检查是否是图片消息：确保返回中包含图片 URL
                    if (value.type === 'image' && (value.file || value.url)) {
                        const imageData = value.file || value.url;
                        const resolution = await this.getImageResolution(imageData);
                        let url = value.url;
                        try {
                            // 若无 url，则根据 file 推导
                            if (!url) {
                                if (Buffer.isBuffer(value.file)) {
                                    const name = value.name || `image-${Date.now()}.jpg`;
                                    url = await Bot.fileToUrl(value.file, { name });
                                }
                                else if (typeof value.file === 'string') {
                                    const fileStr = String(value.file);
                                    if (fileStr.startsWith('http')) {
                                        url = fileStr;
                                    }
                                    else if (fileStr.startsWith('base64://')) {
                                        const base64Data = fileStr.replace('base64://', '');
                                        const buf = Buffer.from(base64Data, 'base64');
                                        const name = value.name || `image-${Date.now()}.jpg`;
                                        url = await Bot.fileToUrl(buf, { name });
                                    }
                                    else {
                                        // 本地文件路径 -> 读取后注册 URL
                                        try {
                                            const buf = await fs.readFile(fileStr);
                                            const name = value.name || (path.basename(fileStr) || `image-${Date.now()}.jpg`);
                                            url = await Bot.fileToUrl(buf, { name });
                                        }
                                        catch { }
                                    }
                                }
                            }
                        }
                        catch (e) {
                            // URL 注册失败时静默降级
                        }
                        const localPath = value.mcpLocalPath || (typeof value.file === 'string' && !value.file.startsWith('http') ? value.file : null);
                        const imgSanitized = {
                            type: 'image',
                            url: url || null,
                            name: value.name,
                            path: localPath,
                            resolution: resolution ? `${resolution.width}x${resolution.height}` : 'unknown',
                            imageType: resolution?.type || 'unknown'
                        };
                        sanitized[key] = imgSanitized;
                    }
                    else {
                        // 简单的循环引用检测
                        try {
                            JSON.stringify(value);
                            sanitized[key] = await this.sanitizeContent(value);
                        }
                        catch (error) {
                            sanitized[key] = '[Circular Reference]';
                        }
                    }
                }
                else {
                    sanitized[key] = value;
                }
            }
            return sanitized;
        }
        return content;
    }
    // 新增：列出所有消息响应
    async handleListMessageResponses() {
        const responses = Array.from(this.messageResponseBuffer.entries()).map(([key, responseData]) => ({
            key,
            messageId: responseData.originalMessage.message_id,
            userId: responseData.originalMessage.user_id,
            groupId: responseData.originalMessage.group_id,
            timestamp: responseData.timestamp,
            responseCount: responseData.responses.length,
            hasResponses: responseData.responses.length > 0
        }));
        return {
            responses,
            count: responses.length,
            timestamp: Date.now()
        };
    }
    async handleDebugMemory() {
        const memoryUsage = process.memoryUsage();
        return {
            memory: {
                rss: memoryUsage.rss,
                heapTotal: memoryUsage.heapTotal,
                heapUsed: memoryUsage.heapUsed,
                external: memoryUsage.external,
                arrayBuffers: memoryUsage.arrayBuffers
            },
            formatted: {
                rss: `${Math.round(memoryUsage.rss / 1024 / 1024 * 100) / 100} MB`,
                heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024 * 100) / 100} MB`,
                heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024 * 100) / 100} MB`
            },
            timestamp: Date.now()
        };
    }
    async handleDebugPerformance() {
        return {
            uptime: process.uptime(),
            cpuUsage: process.cpuUsage(),
            platform: process.platform,
            version: process.version,
            timestamp: Date.now()
        };
    }
    // 权限检查
    checkPermission(permission) {
        const allowed = this.config.mcp?.permissions?.[permission];
        if (!allowed) {
            throw new Error(`权限被拒绝: ${permission}`);
        }
    }
    // 系统监控方法
    async handleSystemInfo() {
        const os = await import('node:os');
        return {
            hostname: os.hostname(),
            platform: os.platform(),
            arch: os.arch(),
            release: os.release(),
            type: os.type(),
            cpus: os.cpus().length,
            totalMemory: os.totalmem(),
            freeMemory: os.freemem(),
            uptime: os.uptime(),
            loadavg: os.loadavg(),
            networkInterfaces: Object.keys(os.networkInterfaces()),
            timestamp: Date.now()
        };
    }
    async handleSystemStats() {
        const os = await import('node:os');
        const memoryUsage = process.memoryUsage();
        return {
            cpu: {
                usage: process.cpuUsage(),
                count: os.cpus().length,
                loadavg: os.loadavg()
            },
            memory: {
                total: os.totalmem(),
                free: os.freemem(),
                used: os.totalmem() - os.freemem(),
                process: memoryUsage
            },
            system: {
                uptime: os.uptime(),
                platform: os.platform(),
                arch: os.arch()
            },
            timestamp: Date.now()
        };
    }
    async handleSystemProcesses() {
        try {
            const { stdout } = await execAsync('tasklist /fo csv', { encoding: 'utf8' });
            const lines = stdout.split('\n').slice(1).filter(line => line.trim());
            const processes = lines.map(line => {
                const parts = line.split(',').map(part => part.replace(/"/g, ''));
                return {
                    name: parts[0],
                    pid: parts[1],
                    sessionName: parts[2],
                    sessionNumber: parts[3],
                    memUsage: parts[4]
                };
            });
            return {
                processes: processes.slice(0, 50), // 限制返回前50个进程
                count: processes.length,
                timestamp: Date.now()
            };
        }
        catch (error) {
            return {
                error: error.message,
                processes: [],
                timestamp: Date.now()
            };
        }
    }
    // 网络相关方法
    async handleNetworkPing(data) {
        const { host = 'baidu.com', count = 4 } = data;
        try {
            const { stdout } = await execAsync(`ping -n ${count} ${host}`);
            return {
                host,
                result: stdout,
                success: true,
                timestamp: Date.now()
            };
        }
        catch (error) {
            return {
                host,
                error: error.message,
                success: false,
                timestamp: Date.now()
            };
        }
    }
    async handleNetworkRequest(data) {
        this.checkPermission('allowNetworkAccess');
        const { url, method = 'GET', headers = {}, body } = data;
        if (!url)
            throw new Error('缺少参数: url');
        try {
            const fetch = (await import('node-fetch')).default;
            const options = { method, headers };
            if (body && method !== 'GET') {
                options.body = typeof body === 'string' ? body : JSON.stringify(body);
            }
            const response = await fetch(url, options);
            const responseData = await response.text();
            return {
                url,
                status: response.status,
                statusText: response.statusText,
                headers: Object.fromEntries(response.headers),
                data: responseData,
                timestamp: Date.now()
            };
        }
        catch (error) {
            return {
                url,
                error: error.message,
                timestamp: Date.now()
            };
        }
    }
    async handleNetworkDownload(data) {
        this.checkPermission('allowFileOperations');
        this.checkPermission('allowNetworkAccess');
        const { url, savePath } = data;
        if (!url || !savePath)
            throw new Error('缺少参数: url 和 savePath');
        try {
            const fetch = (await import('node-fetch')).default;
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const buffer = await response.buffer();
            await fs.writeFile(savePath, buffer);
            return {
                url,
                savePath,
                size: buffer.length,
                success: true,
                timestamp: Date.now()
            };
        }
        catch (error) {
            return {
                url,
                savePath,
                error: error.message,
                success: false,
                timestamp: Date.now()
            };
        }
    }
    // 数据库相关方法
    async handleDatabaseQuery(data) {
        this.checkPermission('allowRedis');
        const { query, type = 'redis' } = data;
        if (!query)
            throw new Error('缺少参数: query');
        try {
            if (type === 'redis') {
                // Redis查询
                const result = await redis.eval(query, 0);
                return {
                    query,
                    result,
                    type,
                    timestamp: Date.now()
                };
            }
            throw new Error(`不支持的数据库类型: ${type}`);
        }
        catch (error) {
            return {
                query,
                error: error.message,
                type,
                timestamp: Date.now()
            };
        }
    }
    async handleDatabaseBackup(data) {
        this.checkPermission('allowRedis');
        this.checkPermission('allowFileOperations');
        const { backupPath = `./backup_${Date.now()}.rdb` } = data;
        try {
            await redis.bgsave();
            return {
                backupPath,
                success: true,
                message: '备份已启动',
                timestamp: Date.now()
            };
        }
        catch (error) {
            return {
                backupPath,
                error: error.message,
                success: false,
                timestamp: Date.now()
            };
        }
    }
    async handleDatabaseRestore(data) {
        this.checkPermission('allowRedis');
        this.checkPermission('allowFileOperations');
        const { backupPath } = data;
        if (!backupPath)
            throw new Error('缺少参数: backupPath');
        // 这里需要根据实际的Redis配置来实现恢复逻辑
        return {
            backupPath,
            message: '数据库恢复功能需要手动配置',
            timestamp: Date.now()
        };
    }
    // 任务调度相关方法
    async handleSchedulerAdd(data) {
        this.checkPermission('allowScheduler');
        const { name, cron, action, actionData } = data;
        if (!name || !cron || !action) {
            throw new Error('缺少参数: name, cron, action');
        }
        // 这里需要集成实际的任务调度器
        if (!global.scheduledTasks) {
            global.scheduledTasks = new Map();
        }
        global.scheduledTasks.set(name, {
            cron,
            action,
            actionData,
            createdAt: Date.now()
        });
        return {
            name,
            cron,
            action,
            success: true,
            timestamp: Date.now()
        };
    }
    async handleSchedulerRemove(data) {
        this.checkPermission('allowScheduler');
        const { name } = data;
        if (!name)
            throw new Error('缺少参数: name');
        if (!global.scheduledTasks) {
            global.scheduledTasks = new Map();
        }
        const removed = global.scheduledTasks.delete(name);
        return {
            name,
            removed,
            timestamp: Date.now()
        };
    }
    async handleSchedulerList() {
        this.checkPermission('allowScheduler');
        if (!global.scheduledTasks) {
            global.scheduledTasks = new Map();
        }
        const tasks = Array.from(global.scheduledTasks.entries()).map(([name, task]) => ({
            name,
            ...task
        }));
        return {
            tasks,
            count: tasks.length,
            timestamp: Date.now()
        };
    }
    // 用户管理相关方法
    async handleUserInfo(data) {
        this.checkPermission('allowUserManagement');
        const { userId } = data;
        if (!userId)
            throw new Error('缺少参数: userId');
        try {
            const friend = Bot.pickFriend(userId);
            const info = await friend.getSimpleInfo();
            return {
                userId,
                info,
                timestamp: Date.now()
            };
        }
        catch (error) {
            return {
                userId,
                error: error.message,
                timestamp: Date.now()
            };
        }
    }
    async handleUserList(data) {
        this.checkPermission('allowUserManagement');
        const { limit = 50 } = data;
        try {
            const friends = Array.from(Bot.fl.values()).slice(0, limit).map(friend => ({
                user_id: friend.user_id,
                nickname: friend.nickname,
                remark: friend.remark
            }));
            return {
                friends,
                count: friends.length,
                total: Bot.fl.size,
                timestamp: Date.now()
            };
        }
        catch (error) {
            return {
                error: error.message,
                friends: [],
                timestamp: Date.now()
            };
        }
    }
    async handleUserBan(data) {
        this.checkPermission('allowUserManagement');
        const { userId, reason = '违规行为' } = data;
        if (!userId)
            throw new Error('缺少参数: userId');
        // 这里需要实现实际的封禁逻辑
        if (!global.bannedUsers) {
            global.bannedUsers = new Set();
        }
        global.bannedUsers.add(userId);
        return {
            userId,
            reason,
            banned: true,
            timestamp: Date.now()
        };
    }
    async handleUserUnban(data) {
        this.checkPermission('allowUserManagement');
        const { userId } = data;
        if (!userId)
            throw new Error('缺少参数: userId');
        if (!global.bannedUsers) {
            global.bannedUsers = new Set();
        }
        const removed = global.bannedUsers.delete(userId);
        return {
            userId,
            unbanned: removed,
            timestamp: Date.now()
        };
    }
    // 群组管理相关方法
    async handleGroupInfo(data) {
        this.checkPermission('allowGroupManagement');
        const { groupId } = data;
        if (!groupId)
            throw new Error('缺少参数: groupId');
        try {
            const group = Bot.pickGroup(groupId);
            const info = await group.getInfo();
            return {
                groupId,
                info,
                timestamp: Date.now()
            };
        }
        catch (error) {
            return {
                groupId,
                error: error.message,
                timestamp: Date.now()
            };
        }
    }
    async handleGroupList() {
        this.checkPermission('allowGroupManagement');
        try {
            const groups = Array.from(Bot.gl.values()).map(group => ({
                group_id: group.group_id,
                group_name: group.group_name,
                member_count: group.member_count
            }));
            return {
                groups,
                count: groups.length,
                timestamp: Date.now()
            };
        }
        catch (error) {
            return {
                error: error.message,
                groups: [],
                timestamp: Date.now()
            };
        }
    }
    async handleGroupMembers(data) {
        this.checkPermission('allowGroupManagement');
        const { groupId, limit = 50 } = data;
        if (!groupId)
            throw new Error('缺少参数: groupId');
        try {
            const group = Bot.pickGroup(groupId);
            const members = Array.from(group.members.values()).slice(0, limit).map(member => ({
                user_id: member.user_id,
                nickname: member.nickname,
                card: member.card,
                role: member.role
            }));
            return {
                groupId,
                members,
                count: members.length,
                total: group.members.size,
                timestamp: Date.now()
            };
        }
        catch (error) {
            return {
                groupId,
                error: error.message,
                members: [],
                timestamp: Date.now()
            };
        }
    }
    async handleGroupKick(data) {
        this.checkPermission('allowGroupManagement');
        const { groupId, userId, reason = '违规行为' } = data;
        if (!groupId || !userId)
            throw new Error('缺少参数: groupId 和 userId');
        try {
            const group = Bot.pickGroup(groupId);
            await group.kickMember(userId);
            return {
                groupId,
                userId,
                reason,
                success: true,
                timestamp: Date.now()
            };
        }
        catch (error) {
            return {
                groupId,
                userId,
                error: error.message,
                success: false,
                timestamp: Date.now()
            };
        }
    }
    async handleGroupMute(data) {
        this.checkPermission('allowGroupManagement');
        const { groupId, userId, duration = 600 } = data;
        if (!groupId || !userId)
            throw new Error('缺少参数: groupId 和 userId');
        try {
            const group = Bot.pickGroup(groupId);
            await group.muteMember(userId, duration);
            return {
                groupId,
                userId,
                duration,
                success: true,
                timestamp: Date.now()
            };
        }
        catch (error) {
            return {
                groupId,
                userId,
                error: error.message,
                success: false,
                timestamp: Date.now()
            };
        }
    }
    async handleGroupUnmute(data) {
        this.checkPermission('allowGroupManagement');
        const { groupId, userId } = data;
        if (!groupId || !userId)
            throw new Error('缺少参数: groupId 和 userId');
        try {
            const group = Bot.pickGroup(groupId);
            await group.muteMember(userId, 0);
            return {
                groupId,
                userId,
                success: true,
                timestamp: Date.now()
            };
        }
        catch (error) {
            return {
                groupId,
                userId,
                error: error.message,
                success: false,
                timestamp: Date.now()
            };
        }
    }
    // AI相关方法
    async handleAIChat(data) {
        this.checkPermission('allowAI');
        const { message, model = 'gpt-3.5-turbo' } = data;
        if (!message)
            throw new Error('缺少参数: message');
        // 这里需要集成实际的AI服务
        return {
            message,
            response: '这是一个模拟的AI回复，需要配置实际的AI服务',
            model,
            timestamp: Date.now()
        };
    }
    async handleAIImage(data) {
        this.checkPermission('allowAI');
        const { prompt, size = '512x512' } = data;
        if (!prompt)
            throw new Error('缺少参数: prompt');
        // 这里需要集成实际的AI图像生成服务
        return {
            prompt,
            imageUrl: 'https://example.com/generated-image.jpg',
            size,
            message: '这是一个模拟的AI图像生成，需要配置实际的AI服务',
            timestamp: Date.now()
        };
    }
    async handleAITranslate(data) {
        this.checkPermission('allowAI');
        const { text, from = 'auto', to = 'zh' } = data;
        if (!text)
            throw new Error('缺少参数: text');
        // 这里需要集成实际的翻译服务
        return {
            text,
            translatedText: '这是一个模拟的翻译结果，需要配置实际的翻译服务',
            from,
            to,
            timestamp: Date.now()
        };
    }
    // 媒体处理相关方法
    async handleMediaConvert(data) {
        this.checkPermission('allowMediaProcessing');
        const { inputPath, outputPath, format } = data;
        if (!inputPath || !outputPath || !format) {
            throw new Error('缺少参数: inputPath, outputPath, format');
        }
        // 这里需要集成实际的媒体转换工具（如FFmpeg）
        return {
            inputPath,
            outputPath,
            format,
            message: '媒体转换功能需要配置FFmpeg',
            timestamp: Date.now()
        };
    }
    async handleMediaCompress(data) {
        this.checkPermission('allowMediaProcessing');
        const { inputPath, outputPath, quality = 80 } = data;
        if (!inputPath || !outputPath) {
            throw new Error('缺少参数: inputPath, outputPath');
        }
        // 这里需要集成实际的媒体压缩工具
        return {
            inputPath,
            outputPath,
            quality,
            message: '媒体压缩功能需要配置相应工具',
            timestamp: Date.now()
        };
    }
    async handleMediaInfo(data) {
        this.checkPermission('allowMediaProcessing');
        const { filePath } = data;
        if (!filePath)
            throw new Error('缺少参数: filePath');
        try {
            const stats = await fs.stat(filePath);
            return {
                filePath,
                size: stats.size,
                created: stats.birthtime,
                modified: stats.mtime,
                isFile: stats.isFile(),
                isDirectory: stats.isDirectory(),
                timestamp: Date.now()
            };
        }
        catch (error) {
            return {
                filePath,
                error: error.message,
                timestamp: Date.now()
            };
        }
    }
    // 广播事件给MCP客户端
    broadcastEvent(eventType, eventData) {
        // 这里需要访问MCPServer实例来广播
        // 可以通过事件系统或者直接引用来实现
        if (global.mcpServer) {
            global.mcpServer.broadcast({
                type: 'event',
                eventType,
                data: eventData,
                timestamp: Date.now()
            });
        }
    }
    /**
     * 获取当前时间信息（精确到毫秒）
     * @param {Object} data - 请求数据 {timezone?}
     * @returns {Object} 时间信息
     */
    async handleGetTime(data) {
        const now = new Date();
        const timezone = data?.timezone || 'Asia/Shanghai';
        try {
            // 获取指定时区的时间
            const timeInTimezone = new Date(now.toLocaleString("en-US", { timeZone: timezone }));
            // 生成精确到毫秒的时间格式 HH:mm:ss.SSS
            const hours = timeInTimezone.getHours().toString().padStart(2, '0');
            const minutes = timeInTimezone.getMinutes().toString().padStart(2, '0');
            const seconds = timeInTimezone.getSeconds().toString().padStart(2, '0');
            const milliseconds = timeInTimezone.getMilliseconds().toString().padStart(3, '0');
            const preciseTime = `${hours}:${minutes}:${seconds}.${milliseconds}`;
            return {
                success: true,
                action: 'time.get',
                data: {
                    // 主要返回值：精确到毫秒的时间格式
                    time: preciseTime,
                    // 其他有用的时间信息
                    timestamp: now.getTime(),
                    iso: now.toISOString(),
                    timezone: timezone,
                    date: timeInTimezone.toLocaleDateString(),
                    // 详细时间组件
                    year: timeInTimezone.getFullYear(),
                    month: timeInTimezone.getMonth() + 1,
                    day: timeInTimezone.getDate(),
                    hour: timeInTimezone.getHours(),
                    minute: timeInTimezone.getMinutes(),
                    second: timeInTimezone.getSeconds(),
                    millisecond: timeInTimezone.getMilliseconds(),
                    // 常用格式
                    formatted: {
                        'HH:mm:ss.SSS': preciseTime,
                        'YYYY-MM-DD HH:mm:ss.SSS': `${timeInTimezone.getFullYear()}-${(timeInTimezone.getMonth() + 1).toString().padStart(2, '0')}-${timeInTimezone.getDate().toString().padStart(2, '0')} ${preciseTime}`,
                        'YYYY-MM-DD': `${timeInTimezone.getFullYear()}-${(timeInTimezone.getMonth() + 1).toString().padStart(2, '0')}-${timeInTimezone.getDate().toString().padStart(2, '0')}`,
                        'HH:mm:ss': `${hours}:${minutes}:${seconds}`,
                        'HH:mm': `${hours}:${minutes}`
                    }
                },
                timestamp: now.getTime(),
                responseTime: 1
            };
        }
        catch (error) {
            return {
                success: false,
                action: 'time.get',
                error: error.message,
                timestamp: Date.now()
            };
        }
    }
}
//# sourceMappingURL=MCPHandler.js.map