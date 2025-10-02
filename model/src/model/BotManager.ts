// @ts-nocheck
/**
 * Bot 控制和状态管理模块
 * 负责 Bot 的启动、停止、重启、状态查询等功能
 */

export class BotManager {
  constructor(config) {
    this.config = config;
  }

  /**
   * 检查权限
   * @param {string} permission 权限名称
   */
  checkPermission(permission) {
    if (!this.config?.mcp?.permissions?.[permission]) {
      throw new Error(`权限不足: ${permission}`);
    }
  }

  /**
   * Bot 重启
   * @param {Object} data 重启参数
   * @returns {Object} 重启结果
   */
  async restart(data) {
    this.checkPermission('allowRestart');

    const { force = false, delay = 1000 } = data || {};

    logger.info('[MCP Handler] 执行Bot重启', { force, delay });

    // 统一延迟两秒重启
    setTimeout(() => {
      process.exit(0);
    }, 2000);

    return {
      success: true,
      message: 'Bot重启命令已发送',
      delay: 2000,
      force,
      timestamp: Date.now()
    };
  }

  /**
   * Bot 关闭
   * @param {Object} data 关闭参数
   * @returns {Object} 关闭结果
   */
  async shutdown(data) {
    this.checkPermission('allowRestart');

    const { delay = 5000 } = data || {};

    logger.info('[MCP Handler] 执行Bot关闭', { delay });

    setTimeout(() => {
      process.exit(0);
    }, delay);
    
    return {
      success: true,
      message: 'Bot关闭命令已发送',
      delay,
      timestamp: Date.now()
    };
  }

  /**
   * 获取 Bot 状态
   * @returns {Object} Bot 状态信息
   */
  async getStatus() {
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
          
          // 各种组件信息
          renderers,
          databases,
          servers,
          routes,
          plugins,
          scheduledTasks,
          handlers,
          listeners,
          adapters,
          accounts,
          globals
        },
        timestamp: Date.now(),
        responseTime: 1
      };
    } catch (error) {
      logger.error('[MCP Handler] 获取Bot状态失败:', error);
      return {
        success: false,
        action: 'bot.status',
        error: error.message,
        timestamp: Date.now()
      };
    }
  }

  /**
   * 获取 Bot 信息
   * @returns {Object} Bot 信息
   */
  async getInfo() {
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
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
      return { error: error.message, count: 0, enabled: 0, disabled: 0, list: [] };
    }
  }

  // 获取定时任务信息
  getScheduledTaskInfo() {
    try {
      const tasks = [];

      // 检查 node-cron 任务
      if (global.Bot?.cron) {
        tasks.push({
          name: 'Bot Cron Tasks',
          type: 'cron',
          status: 'active'
        });
      }

      // 检查 setTimeout/setInterval
      const timers = process._getActiveHandles().filter(handle =>
        handle.constructor.name === 'Timeout' || handle.constructor.name === 'Timer'
      );

      return {
        count: tasks.length,
        active: tasks.filter(t => t.status === 'active').length,
        timers: timers.length,
        list: tasks
      };
    } catch (error) {
      return { error: error.message, count: 0, active: 0, timers: 0, list: [] };
    }
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

      return {
        count: handlers.length,
        totalListeners: handlers.reduce((sum, h) => sum + h.listenerCount, 0),
        list: handlers
      };
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
      return { error: error.message, important: {}, all: {}, environment: {}, globalCount: 0, envCount: 0, globalKeys: [] };
    }
  }

  // 获取变量的详细信息
  getVariableInfo(value) {
    try {
      if (value === null) return 'null';
      if (value === undefined) return 'undefined';

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
    } catch (error) {
      return { error: error.message };
    }
  }
}
// @ts-nocheck
