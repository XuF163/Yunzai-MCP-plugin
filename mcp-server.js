#!/usr/bin/env node
/**
 * Yunzai MCP Server - 独立的MCP服务器程序
 * 用于与IDE的MCP客户端进行通信
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// MCP服务器配置
const MCP_CONFIG = {
    name: 'yunzai-mcp',
    version: '1.0.0',
    description: 'Yunzai Bot MCP Server',
    yunzaiUrl: 'http://localhost:2536/MCP',
    apiKey: 'mcp-yunzai-2024'
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
    } catch (error) {
        log('error', `Request failed for ${endpoint}`, { error: error.message, data });
        throw error;
    }
}

// MCP工具定义
const MCP_TOOLS = {
    'yunzai_bot_status': {
        name: 'yunzai_bot_status',
        description: '获取Yunzai机器人状态信息',
        inputSchema: {
            type: 'object',
            properties: {},
            required: []
        }
    },
    'yunzai_send_message': {
        name: 'yunzai_send_message',
        description: '通过Yunzai发送消息',
        inputSchema: {
            type: 'object',
            properties: {
                message: {
                    type: 'string',
                    description: '要发送的消息内容'
                },
                user_id: {
                    type: 'string',
                    description: '目标用户ID（可选）'
                }
            },
            required: ['message']
        }
    },
    'yunzai_redis_get': {
        name: 'yunzai_redis_get',
        description: '从Yunzai Redis获取数据',
        inputSchema: {
            type: 'object',
            properties: {
                key: {
                    type: 'string',
                    description: 'Redis键名'
                }
            },
            required: ['key']
        }
    },
    'yunzai_redis_set': {
        name: 'yunzai_redis_set',
        description: '向Yunzai Redis设置数据',
        inputSchema: {
            type: 'object',
            properties: {
                key: {
                    type: 'string',
                    description: 'Redis键名'
                },
                value: {
                    type: 'string',
                    description: '要设置的值'
                },
                expire: {
                    type: 'number',
                    description: '过期时间（秒）'
                }
            },
            required: ['key', 'value']
        }
    },
    'yunzai_memory_info': {
        name: 'yunzai_memory_info',
        description: '获取Yunzai内存使用信息',
        inputSchema: {
            type: 'object',
            properties: {},
            required: []
        }
    },
    'yunzai_send_friend_message': {
        name: 'yunzai_send_friend_message',
        description: '发送好友消息',
        inputSchema: {
            type: 'object',
            properties: {
                user_id: {
                    type: 'string',
                    description: '目标用户ID'
                },
                message: {
                    type: 'string',
                    description: '消息内容'
                },
                bot_id: {
                    type: 'string',
                    description: 'Bot ID（可选）'
                }
            },
            required: ['user_id', 'message']
        }
    },
    'yunzai_send_group_message': {
        name: 'yunzai_send_group_message',
        description: '发送群消息',
        inputSchema: {
            type: 'object',
            properties: {
                group_id: {
                    type: 'string',
                    description: '目标群ID'
                },
                message: {
                    type: 'string',
                    description: '消息内容'
                },
                bot_id: {
                    type: 'string',
                    description: 'Bot ID（可选）'
                }
            },
            required: ['group_id', 'message']
        }
    },
    'yunzai_recall_message': {
        name: 'yunzai_recall_message',
        description: '撤回消息',
        inputSchema: {
            type: 'object',
            properties: {
                message_id: {
                    type: 'string',
                    description: '消息ID'
                },
                type: {
                    type: 'string',
                    description: '消息类型: private 或 group',
                    enum: ['private', 'group']
                },
                user_id: {
                    type: 'string',
                    description: '用户ID（私聊消息）'
                },
                group_id: {
                    type: 'string',
                    description: '群ID（群消息）'
                },
                bot_id: {
                    type: 'string',
                    description: 'Bot ID（可选）'
                }
            },
            required: ['message_id']
        }
    },
    'yunzai_message_history': {
        name: 'yunzai_message_history',
        description: '获取消息历史记录',
        inputSchema: {
            type: 'object',
            properties: {
                type: {
                    type: 'string',
                    description: '消息类型: private 或 group',
                    enum: ['private', 'group']
                },
                user_id: {
                    type: 'string',
                    description: '用户ID（私聊历史）'
                },
                group_id: {
                    type: 'string',
                    description: '群ID（群历史）'
                },
                count: {
                    type: 'number',
                    description: '获取消息数量（默认20）'
                },
                message_seq: {
                    type: 'number',
                    description: '消息序号（可选）'
                },
                bot_id: {
                    type: 'string',
                    description: 'Bot ID（可选）'
                }
            },
            required: ['type']
        }
    },
    'yunzai_get_message': {
        name: 'yunzai_get_message',
        description: '获取指定消息详情',
        inputSchema: {
            type: 'object',
            properties: {
                message_id: {
                    type: 'string',
                    description: '消息ID'
                },
                bot_id: {
                    type: 'string',
                    description: 'Bot ID（可选）'
                }
            },
            required: ['message_id']
        }
    },
    'yunzai_get_forward_message': {
        name: 'yunzai_get_forward_message',
        description: '获取转发消息内容',
        inputSchema: {
            type: 'object',
            properties: {
                message_id: {
                    type: 'string',
                    description: '转发消息ID'
                },
                bot_id: {
                    type: 'string',
                    description: 'Bot ID（可选）'
                }
            },
            required: ['message_id']
        }
    },
    'yunzai_restart': {
        name: 'yunzai_restart',
        description: '重启Yunzai机器人',
        inputSchema: {
            type: 'object',
            properties: {
                force: {
                    type: 'boolean',
                    description: '是否强制重启（默认false）'
                },
                delay: {
                    type: 'number',
                    description: '重启延迟时间（毫秒，默认1000）'
                }
            },
            required: []
        }
    },
    'yunzai_get_logs': {
        name: 'yunzai_get_logs',
        description: '获取Yunzai运行日志',
        inputSchema: {
            type: 'object',
            properties: {
                lines: {
                    type: 'number',
                    description: '获取日志行数（默认100）'
                },
                level: {
                    type: 'string',
                    description: '日志级别过滤（info, warn, error, debug等）'
                },
                since: {
                    type: 'string',
                    description: '获取指定时间之后的日志（ISO时间字符串）'
                },
                search: {
                    type: 'string',
                    description: '搜索关键词'
                },
                includeRaw: {
                    type: 'boolean',
                    description: '是否包含原始日志数据（默认false）'
                }
            },
            required: []
        }
    },
    'yunzai_get_message_responses': {
        name: 'yunzai_get_message_responses',
        description: '获取消息处理后的完整响应',
        inputSchema: {
            type: 'object',
            properties: {
                messageId: {
                    type: 'string',
                    description: '消息ID'
                },
                userId: {
                    type: 'string',
                    description: '用户ID'
                },
                groupId: {
                    type: 'string',
                    description: '群ID'
                },
                since: {
                    type: 'string',
                    description: '获取指定时间之后的响应（ISO时间字符串）'
                },
                includeOriginal: {
                    type: 'boolean',
                    description: '是否包含原始消息（默认true）'
                }
            },
            required: []
        }
    }
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
                
            case 'yunzai_message_history':
                return await makeRequest('message.history', {
                    type: args.type,
                    user_id: args.user_id,
                    group_id: args.group_id,
                    count: args.count,
                    message_seq: args.message_seq,
                    bot_id: args.bot_id
                });
                
            case 'yunzai_get_message':
                return await makeRequest('message.get', {
                    message_id: args.message_id,
                    bot_id: args.bot_id
                });
                
            case 'yunzai_get_forward_message':
                return await makeRequest('message.forward', {
                    message_id: args.message_id,
                    bot_id: args.bot_id
                });

            case 'yunzai_restart':
                return await makeRequest('bot.restart', {
                    force: args.force,
                    delay: args.delay
                });

            case 'yunzai_get_logs':
                return await makeRequest('logs.get', {
                    lines: args.lines,
                    level: args.level,
                    since: args.since,
                    search: args.search,
                    includeRaw: args.includeRaw
                });

            case 'yunzai_get_message_responses':
                return await makeRequest('message.response', {
                    messageId: args.messageId,
                    userId: args.userId,
                    groupId: args.groupId,
                    since: args.since,
                    includeOriginal: args.includeOriginal
                });

            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    } catch (error) {
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
        } else {
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
        } catch (error) {
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
        } catch (error) {
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
                    } catch (error) {
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