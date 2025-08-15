import express from 'express';
import { WebSocketServer } from 'ws';
import yaml from 'js-yaml';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MCPHandler } from './MCPHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class MCPServer {
  constructor() {
    this.config = this.loadConfig();
    this.handler = new MCPHandler(this.config);
    this.clients = new Map();
    this.requestHistory = [];
  }

  loadConfig() {
    try {
      const configPath = path.join(__dirname, '../config/config.yaml');
      const defaultConfigPath = path.join(__dirname, '../config/defSet.yaml');
      
      let configFile = configPath;
      if (!fs.existsSync(configPath)) {
        configFile = defaultConfigPath;
      }
      
      const configContent = fs.readFileSync(configFile, 'utf8');
      return yaml.load(configContent);
    } catch (error) {
      logger.error('[MCP Server] 配置文件加载失败:', error);
      return {
        mcp: {
          server: { enabled: true, path: '/MCP', verbose: true },
          permissions: { allowRestart: true, allowRedis: true },
          security: { maxRequestSize: 10, rateLimit: 100 }
        }
      };
    }
  }

  async start() {
    if (!this.config.mcp?.server?.enabled) {
      logger.info('[MCP Server] MCP服务器已禁用');
      return;
    }

    // 检查是否有可用的Express应用
    if (!Bot.express) {
      logger.error('[MCP Server] Bot.express 不可用，无法启动MCP服务器');
      return;
    }

    // 注册到Yunzai的Express应用
    this.registerRoutes();
    
    logger.mark(`[MCP Server] MCP服务器已启动，共享Yunzai端口`);
    logger.info(`[MCP Server] 路径: ${this.config.mcp.server.path}`);
    logger.info(`[MCP Server] 健康检查: ${this.config.mcp.server.path}/health`);
    logger.info(`[MCP Server] API端点: ${this.config.mcp.server.path}/api/:action`);
  }

  registerRoutes() {
    const mcpPath = this.config.mcp.server.path || '/MCP';
    
    // 参考Guoba的做法，添加到跳过认证和静默列表
    if (Array.isArray(Bot.express.skip_auth)) {
      Bot.express.skip_auth.push(mcpPath);
    }
    
    if (Array.isArray(Bot.express.quiet)) {
      Bot.express.quiet.push(mcpPath);
      Bot.express.quiet.push(`${mcpPath}/api/logs.get`);
      Bot.express.quiet.push(`${mcpPath}/api/message.response`);
      Bot.express.quiet.push(`${mcpPath}/api/test.message`);
      Bot.express.quiet.push(`${mcpPath}/api/bot.status`);
    }

    // 健康检查端点
    Bot.express.get(`${mcpPath}/health`, (req, res) => {
      res.json({
        status: 'ok',
        timestamp: Date.now(),
        version: '1.0.0',
        mcp_server: 'Yunzai-MCP-plugin',
        bot_status: {
          uin: Bot.uin?.toString() || 'unknown',
          online: Object.keys(Bot.bots || {}).length > 0,
          bots_count: Object.keys(Bot.bots || {}).length
        },
        capabilities: this.getCapabilities()
      });
    });

    // MCP API端点 - 支持GET和POST
    Bot.express.get(`${mcpPath}/api/:action`, this.handleAPIRequest.bind(this));
    Bot.express.post(`${mcpPath}/api/:action`, this.handleAPIRequest.bind(this));
    
    // WebSocket升级处理
    Bot.express.get(`${mcpPath}/ws`, (req, res) => {
      res.status(426).json({ 
        error: 'Upgrade Required', 
        message: 'Use WebSocket connection',
        websocket_url: `ws://localhost:${Bot.express?.server?.address()?.port || 'unknown'}${mcpPath}/ws`
      });
    });

    // 注册WebSocket处理
    this.setupWebSocket(mcpPath);

    logger.info(`[MCP Server] 路由已注册到Yunzai Express应用: ${mcpPath}`);
  }

  setupWebSocket(mcpPath) {
    // 检查Yunzai的WebSocket系统是否可用
    if (!Bot.wsf) {
      logger.warn('[MCP Server] Bot.wsf 不可用，WebSocket功能将被禁用');
      return;
    }

    // 注册WebSocket处理器到Yunzai的wsf系统
    const pathKey = mcpPath.substring(1); // 移除开头的'/'
    
    if (!Bot.wsf[pathKey]) {
      Bot.wsf[pathKey] = [];
    }
    
    // 添加WebSocket连接处理器
    Bot.wsf[pathKey].push((ws, request) => {
      // 检查路径是否匹配 /MCP/ws
      if (request.url.endsWith('/ws')) {
        this.handleWebSocketConnection(ws, request);
      }
    });
    
    logger.info(`[MCP Server] WebSocket处理器已注册: ${pathKey}`);
  }

  handleWebSocketConnection(ws, request) {
    const clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.clients.set(clientId, {
      ws,
      connected: Date.now(),
      lastActivity: Date.now()
    });

    logger.info(`[MCP Server] WebSocket客户端连接: ${clientId}`);

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        await this.handleWebSocketMessage(clientId, message);
      } catch (error) {
        logger.error('[MCP Server] WebSocket消息处理错误:', error);
        ws.send(JSON.stringify({ error: 'Invalid message format' }));
      }
    });

    ws.on('close', () => {
      this.clients.delete(clientId);
      logger.info(`[MCP Server] WebSocket客户端断开: ${clientId}`);
    });

    ws.on('error', (error) => {
      logger.error(`[MCP Server] WebSocket错误 ${clientId}:`, error);
    });

    // 发送欢迎消息
    ws.send(JSON.stringify({
      type: 'welcome',
      clientId,
      timestamp: Date.now(),
      capabilities: this.getCapabilities()
    }));
  }

  async handleAPIRequest(req, res) {
    const { action } = req.params;
    const startTime = Date.now();

    try {
      // 设置CORS头
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

      // 处理OPTIONS预检请求
      if (req.method === 'OPTIONS') {
        return res.status(200).end();
      }

      // 验证API密钥（如果配置了的话）
      if (!this.validateApiKey(req)) {
        return res.status(401).json({ 
          success: false,
          error: 'Unauthorized',
          timestamp: Date.now()
        });
      }

      // 记录请求
      this.logRequest(req, action);

      // 获取请求数据（支持GET和POST）
      const requestData = req.method === 'GET' ? req.query : req.body;

      // 处理请求
      const result = await this.handler.handleAction(action, requestData, req);
      
      const responseTime = Date.now() - startTime;
      
      res.json({
        success: true,
        action,
        data: result,
        timestamp: Date.now(),
        responseTime
      });

    } catch (error) {
      logger.error(`[MCP Server] API请求处理错误 ${action}:`, error);
      
      const responseTime = Date.now() - startTime;
      res.status(500).json({
        success: false,
        action,
        error: error.message,
        timestamp: Date.now(),
        responseTime
      });
    }
  }

  async handleWebSocketMessage(clientId, message) {
    const client = this.clients.get(clientId);
    if (!client) return;

    client.lastActivity = Date.now();

    try {
      const result = await this.handler.handleAction(message.action, message.data, { clientId });
      
      client.ws.send(JSON.stringify({
        id: message.id,
        success: true,
        data: result,
        timestamp: Date.now()
      }));
    } catch (error) {
      client.ws.send(JSON.stringify({
        id: message.id,
        success: false,
        error: error.message,
        timestamp: Date.now()
      }));
    }
  }

  validateApiKey(req) {
    // 如果没有配置API密钥，则跳过验证
    if (!this.config.mcp?.security?.apiKey) {
      return true;
    }

    const apiKey = req.headers['x-api-key'] || 
                   req.headers['authorization']?.replace('Bearer ', '') ||
                   req.query.apiKey ||
                   req.body?.apiKey;
    return apiKey === this.config.mcp.security.apiKey;
  }

  logRequest(req, action) {
    if (this.config.mcp?.security?.logAllRequests) {
      const logEntry = {
        timestamp: Date.now(),
        action,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        body: req.body
      };
      
      this.requestHistory.push(logEntry);
      
      // 限制历史记录大小
      const maxSize = this.config.mcp?.debug?.maxHistorySize || 1000;
      if (this.requestHistory.length > maxSize) {
        this.requestHistory = this.requestHistory.slice(-maxSize);
      }
      
      // 只对非常用操作打印日志，避免刷屏
      const quietActions = ['logs.get', 'message.response', 'bot.status'];
      if (this.config.mcp?.server?.verbose && !quietActions.includes(action)) {
        logger.info(`[MCP Server] ${action} 请求来自 ${req.ip}`);
      }
    }
  }

  getCapabilities() {
    return {
      actions: [
        'bot.status',
        'send.message',
        'send.friend', 
        'send.group',
        'recall.message',
        'message.history',
        'message.get',
        'message.forward',
        'redis.get',
        'redis.set',
        'debug.logs',
        'debug.memory',
        'debug.performance'
      ],
      features: {
        websocket: !!Bot.wsf,
        redis: !!redis,
        file_operations: true,
        message_handling: true
      },
      permissions: {
        botControl: this.config.mcp?.permissions?.allowRestart || false,
        redisAccess: this.config.mcp?.permissions?.allowRedis || false,
        messageHandling: this.config.mcp?.permissions?.allowSendMessage || false,
        pluginAccess: this.config.mcp?.permissions?.allowPluginAccess || false,
        fileOperations: this.config.mcp?.permissions?.allowFileOperations || false,
        commandExecution: this.config.mcp?.permissions?.allowCommandExecution || false
      },
      version: '1.0.0',
      server: 'Yunzai-MCP-plugin'
    };
  }

  // 广播消息给所有连接的客户端
  broadcast(message) {
    this.clients.forEach((client, clientId) => {
      try {
        client.ws.send(JSON.stringify({
          type: 'broadcast',
          data: message,
          timestamp: Date.now()
        }));
      } catch (error) {
        logger.error(`[MCP Server] 广播消息失败 ${clientId}:`, error);
      }
    });
  }

  // 获取服务器状态
  getStatus() {
    return {
      running: true,
      clients: this.clients.size,
      requestHistory: this.requestHistory.length,
      config: this.config.mcp,
      uptime: Date.now() - (Bot.stat?.start_time * 1000 || Date.now())
    };
  }
}