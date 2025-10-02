// @ts-nocheck
// shebang removed in TS source; added by runtime launcher if needed
/**
 * Yunzai MCP Server - 独立的MCP服务器程序
 * 用于与IDE的MCP客户端进行通信
 */
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// MCP服务器配置（支持环境变量覆盖）
const ENV = process.env;
const baseUrl = ENV.YUNZAI_MCP_URL
    ? ENV.YUNZAI_MCP_URL
    : `${ENV.YUNZAI_BASE_URL || 'http://localhost:2536'}${ENV.YUNZAI_MCP_PATH || '/MCP'}`;
const MCP_CONFIG = {
    name: 'yunzai-mcp',
    version: '1.1.0',
    description: 'Yunzai Bot MCP Server',
    yunzaiUrl: baseUrl,
    apiKey: ENV.YUNZAI_API_KEY || 'mcp-yunzai-2024'
};
// 日志函数
function log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
        timestamp,
        level,
        message,
        data
    };
    // 输出到stderr供MCP客户端读取
    console.error(JSON.stringify(logEntry));
}
// HTTP请求函数
async function makeRequest(endpoint, data = {}) {
    try {
        const fetch = (await import('node-fetch')).default;
        const response = await fetch(`${MCP_CONFIG.yunzaiUrl}/api/${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': MCP_CONFIG.apiKey
            },
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return await response.json();
    }
    catch (error) {
        log('error', `Request failed for ${endpoint}`, { error: error.message, data });
        throw error;
    }
}
// MCP工具定义（精简版）
const MCP_TOOLS = {
    // Bot 状态
    'bot_status': {
        name: 'bot_status',
        description: '获取Yunzai机器人状态信息',
        inputSchema: { type: 'object', properties: {}, required: [] }
    },
    // Bot 控制
    'bot_restart': {
        name: 'bot_restart',
        description: '重启Yunzai机器人（需权限）',
        inputSchema: {
            type: 'object',
            properties: {
                force: { type: 'boolean', description: '是否强制重启（默认false）' },
                delay: { type: 'number', description: '延迟毫秒（默认1000）' }
            },
            required: []
        }
    },
    'bot_shutdown': {
        name: 'bot_shutdown',
        description: '关闭Yunzai机器人（需权限）',
        inputSchema: {
            type: 'object',
            properties: {
                delay: { type: 'number', description: '延迟毫秒（默认5000）' }
            },
            required: []
        }
    },
    // 入站唯一入口
    'mock_incoming_message': {
        name: 'mock_incoming_message',
        description: 'LLM→Bot 入站消息（带 group_id 视为群聊），支持等待聚合回复',
        inputSchema: {
            type: 'object',
            properties: {
                message: { type: 'string' },
                user_id: { type: 'string' },
                group_id: { type: 'string' },
                nickname: { type: 'string' },
                role: { type: 'string', enum: ['member', 'admin', 'owner'] },
                waitMs: { type: 'number' },
                traceId: { type: 'string' }
            },
            required: ['message', 'user_id']
        }
    },
    // Mock 管理
    'mock_status': { name: 'mock_status', description: 'Mock 适配器状态', inputSchema: { type: 'object', properties: {}, required: [] } },
    'mock_friend_add': { name: 'mock_friend_add', description: '添加好友', inputSchema: { type: 'object', properties: { user_id: { type: 'string' }, nickname: { type: 'string' } }, required: ['user_id'] } },
    'mock_friend_remove': { name: 'mock_friend_remove', description: '移除好友', inputSchema: { type: 'object', properties: { user_id: { type: 'string' } }, required: ['user_id'] } },
    'mock_friend_list': { name: 'mock_friend_list', description: '列出好友', inputSchema: { type: 'object', properties: {}, required: [] } },
    'mock_group_add': { name: 'mock_group_add', description: '添加群', inputSchema: { type: 'object', properties: { group_id: { type: 'string' }, name: { type: 'string' } }, required: ['group_id'] } },
    'mock_group_remove': { name: 'mock_group_remove', description: '移除群', inputSchema: { type: 'object', properties: { group_id: { type: 'string' } }, required: ['group_id'] } },
    'mock_group_list': { name: 'mock_group_list', description: '列出群', inputSchema: { type: 'object', properties: {}, required: [] } },
    'mock_group_member_add': { name: 'mock_group_member_add', description: '添加群成员', inputSchema: { type: 'object', properties: { group_id: { type: 'string' }, user_id: { type: 'string' }, nickname: { type: 'string' }, role: { type: 'string' } }, required: ['group_id', 'user_id'] } },
    'mock_group_member_remove': { name: 'mock_group_member_remove', description: '移除群成员', inputSchema: { type: 'object', properties: { group_id: { type: 'string' }, user_id: { type: 'string' } }, required: ['group_id', 'user_id'] } },
    'mock_group_members': { name: 'mock_group_members', description: '列出群成员', inputSchema: { type: 'object', properties: { group_id: { type: 'string' } }, required: ['group_id'] } },
    'mock_history': { name: 'mock_history', description: '获取Mock收发历史（合并inbox/outbox）', inputSchema: { type: 'object', properties: { type: { type: 'string', enum: ['private', 'group'] }, target: { type: 'string' }, limit: { type: 'number' } }, required: [] } },
    // 消息查询
    'message_history': { name: 'message_history', description: '获取消息历史', inputSchema: { type: 'object', properties: { type: { type: 'string', enum: ['private', 'group'] }, user_id: { type: 'string' }, group_id: { type: 'string' }, count: { type: 'number' }, message_seq: { type: 'number' } }, required: ['type'] } },
    'message_get': { name: 'message_get', description: '获取消息详情', inputSchema: { type: 'object', properties: { message_id: { type: 'string' } }, required: ['message_id'] } },
    'message_forward': { name: 'message_forward', description: '获取转发消息内容', inputSchema: { type: 'object', properties: { message_id: { type: 'string' } }, required: ['message_id'] } },
    'recall_message': { name: 'recall_message', description: '撤回消息（Mock标记撤回）', inputSchema: { type: 'object', properties: { message_id: { type: 'string' }, type: { type: 'string', enum: ['private', 'group'] }, user_id: { type: 'string' }, group_id: { type: 'string' }, bot_id: { type: 'string' } }, required: ['message_id'] } }
};
// 工具执行函数
async function executeTool(name, args) {
    log('info', `Executing tool: ${name}`, args);
    try {
        switch (name) {
            case 'yunzai_bot_status':
                return await makeRequest('bot.status');
            case 'yunzai_send_message':
                return await makeRequest('test.message', {
                    message: args.message,
                    user_id: args.user_id || 'mcp_client'
                });
            case 'yunzai_redis_get':
                return await makeRequest('redis.get', { key: args.key });
            case 'yunzai_redis_set':
                return await makeRequest('redis.set', {
                    key: args.key,
                    value: args.value,
                    expire: args.expire
                });
            case 'yunzai_memory_info':
                return await makeRequest('memory.info');
            case 'yunzai_send_friend_message':
                return await makeRequest('send.friend', {
                    user_id: args.user_id,
                    message: args.message,
                    bot_id: args.bot_id
                });
            case 'yunzai_send_group_message':
                return await makeRequest('send.group', {
                    group_id: args.group_id,
                    message: args.message,
                    bot_id: args.bot_id
                });
            case 'yunzai_recall_message':
                return await makeRequest('recall.message', {
                    message_id: args.message_id,
                    type: args.type,
                    user_id: args.user_id,
                    group_id: args.group_id,
                    bot_id: args.bot_id
                });
            case 'message_history':
                return await makeRequest('message.history', {
                    type: args.type,
                    user_id: args.user_id,
                    group_id: args.group_id,
                    count: args.count,
                    message_seq: args.message_seq,
                    bot_id: args.bot_id
                });
            case 'message_get':
                return await makeRequest('message.get', {
                    message_id: args.message_id,
                    bot_id: args.bot_id
                });
            case 'message_forward':
                return await makeRequest('message.forward', {
                    message_id: args.message_id,
                    bot_id: args.bot_id
                });
            case 'recall_message':
                return await makeRequest('recall.message', {
                    message_id: args.message_id,
                    type: args.type,
                    user_id: args.user_id,
                    group_id: args.group_id,
                    bot_id: args.bot_id
                });
            case 'mock_incoming_message':
                return await makeRequest('mock.incoming.message', {
                    message: args.message,
                    user_id: args.user_id,
                    group_id: args.group_id,
                    nickname: args.nickname,
                    role: args.role,
                    waitMs: args.waitMs,
                    traceId: args.traceId
                });
            case 'mock_status':
                return await makeRequest('mock.status');
            case 'mock_friend_add':
                return await makeRequest('mock.friend.add', { user_id: args.user_id, nickname: args.nickname });
            case 'mock_friend_remove':
                return await makeRequest('mock.friend.remove', { user_id: args.user_id });
            case 'mock_friend_list':
                return await makeRequest('mock.friend.list');
            case 'mock_group_add':
                return await makeRequest('mock.group.add', { group_id: args.group_id, name: args.name });
            case 'mock_group_remove':
                return await makeRequest('mock.group.remove', { group_id: args.group_id });
            case 'mock_group_list':
                return await makeRequest('mock.group.list');
            case 'mock_group_member_add':
                return await makeRequest('mock.group.member.add', { group_id: args.group_id, user_id: args.user_id, nickname: args.nickname, role: args.role });
            case 'mock_group_member_remove':
                return await makeRequest('mock.group.member.remove', { group_id: args.group_id, user_id: args.user_id });
            case 'mock_group_members':
                return await makeRequest('mock.group.members', { group_id: args.group_id });
            case 'mock_history':
                return await makeRequest('mock.history', { type: args.type, target: args.target, limit: args.limit });
            case 'bot_status':
                return await makeRequest('bot.status');
            case 'bot_restart':
                return await makeRequest('bot.restart', { force: args.force, delay: args.delay });
            case 'bot_shutdown':
                return await makeRequest('bot.shutdown', { delay: args.delay });
            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    }
    catch (error) {
        log('error', `Tool execution failed: ${name}`, { error: error.message, args });
        throw error;
    }
}
// MCP消息处理
class MCPServer {
    constructor() {
        this.requestId = 0;
        this.initialized = false;
    }
    // 发送响应
    sendResponse(id, result = null, error = null) {
        const response = {
            jsonrpc: '2.0',
            id
        };
        if (error) {
            response.error = {
                code: error.code || -32000,
                message: error.message || 'Unknown error',
                data: error.data
            };
        }
        else {
            response.result = result;
        }
        console.log(JSON.stringify(response));
    }
    // 发送通知
    sendNotification(method, params = {}) {
        const notification = {
            jsonrpc: '2.0',
            method,
            params
        };
        console.log(JSON.stringify(notification));
    }
    // 处理初始化
    async handleInitialize(id, params) {
        log('info', 'MCP Server initializing', params);
        const result = {
            protocolVersion: '2024-11-05',
            capabilities: {
                tools: {
                    listChanged: false
                },
                logging: {}
            },
            serverInfo: {
                name: MCP_CONFIG.name,
                version: MCP_CONFIG.version
            }
        };
        this.sendResponse(id, result);
        this.initialized = true;
        // 发送初始化完成通知
        this.sendNotification('notifications/initialized');
    }
    // 处理工具列表请求
    async handleListTools(id) {
        const tools = Object.values(MCP_TOOLS);
        this.sendResponse(id, { tools });
    }
    // 处理工具调用
    async handleCallTool(id, params) {
        try {
            const { name, arguments: args } = params;
            if (!MCP_TOOLS[name]) {
                throw new Error(`Tool not found: ${name}`);
            }
            const result = await executeTool(name, args || {});
            this.sendResponse(id, {
                content: [{
                        type: 'text',
                        text: JSON.stringify(result, null, 2)
                    }]
            });
        }
        catch (error) {
            this.sendResponse(id, null, {
                code: -32000,
                message: error.message
            });
        }
    }
    // 处理消息
    async handleMessage(message) {
        try {
            const { id, method, params } = message;
            log('debug', `Received message: ${method}`, { id, params });
            switch (method) {
                case 'initialize':
                    await this.handleInitialize(id, params);
                    break;
                case 'tools/list':
                    await this.handleListTools(id);
                    break;
                case 'tools/call':
                    await this.handleCallTool(id, params);
                    break;
                default:
                    this.sendResponse(id, null, {
                        code: -32601,
                        message: `Method not found: ${method}`
                    });
            }
        }
        catch (error) {
            log('error', 'Message handling failed', { error: error.message, message });
            if (message.id) {
                this.sendResponse(message.id, null, {
                    code: -32000,
                    message: error.message
                });
            }
        }
    }
    // 启动服务器
    start() {
        log('info', 'MCP Server starting', MCP_CONFIG);
        // 监听stdin输入
        process.stdin.setEncoding('utf8');
        let buffer = '';
        process.stdin.on('data', (chunk) => {
            buffer += chunk;
            // 处理完整的JSON消息
            let newlineIndex;
            while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
                const line = buffer.slice(0, newlineIndex).trim();
                buffer = buffer.slice(newlineIndex + 1);
                if (line) {
                    try {
                        const message = JSON.parse(line);
                        this.handleMessage(message);
                    }
                    catch (error) {
                        log('error', 'JSON parse error', { error: error.message, line });
                    }
                }
            }
        });
        process.stdin.on('end', () => {
            log('info', 'MCP Server shutting down');
            process.exit(0);
        });
        // 错误处理
        process.on('uncaughtException', (error) => {
            log('error', 'Uncaught exception', { error: error.message, stack: error.stack });
            process.exit(1);
        });
        process.on('unhandledRejection', (reason) => {
            log('error', 'Unhandled rejection', { reason });
            process.exit(1);
        });
        log('info', 'MCP Server ready');
    }
}
// 启动服务器
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1].endsWith('mcp-server.js')) {
    const server = new MCPServer();
    server.start();
}
export default MCPServer;
//# sourceMappingURL=mcp-server.js.map