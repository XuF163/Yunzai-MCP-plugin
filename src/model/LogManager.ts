// @ts-nocheck
/**
 * 日志管理模块
 * 负责日志收集、过滤、查询等功能
 */

export class LogManager {
  constructor(config) {
    this.config = config;
    this.logBuffer = []; // 存储日志
    this.maxLogBufferSize = config?.mcp?.debug?.maxHistorySize || 1000;
    this.setupLogCapture();
  }

  /**
   * 设置日志捕获
   */
  setupLogCapture() {
    // 保存原始的 console 方法
    this.originalConsole = {
      log: console.log,
      error: console.error,
      warn: console.warn,
      info: console.info,
      debug: console.debug
    };

    // 重写 console 方法以捕获日志
    const captureLog = (level, originalMethod) => {
      return (...args) => {
        // 调用原始方法
        originalMethod.apply(console, args);
        
        // 记录到缓冲区
        this.addLogEntry(level, args);
      };
    };

    console.log = captureLog('info', this.originalConsole.log);
    console.error = captureLog('error', this.originalConsole.error);
    console.warn = captureLog('warn', this.originalConsole.warn);
    console.info = captureLog('info', this.originalConsole.info);
    console.debug = captureLog('debug', this.originalConsole.debug);

    // 捕获 logger 输出（如果存在）
    if (global.logger) {
      this.setupLoggerCapture();
    }
  }

  /**
   * 设置 logger 捕获
   */
  setupLoggerCapture() {
    const originalLogger = {
      info: global.logger.info,
      error: global.logger.error,
      warn: global.logger.warn,
      debug: global.logger.debug,
      trace: global.logger.trace,
      mark: global.logger.mark
    };

    const captureLogger = (level, originalMethod) => {
      return (...args) => {
        // 调用原始方法
        if (originalMethod) {
          originalMethod.apply(global.logger, args);
        }
        
        // 记录到缓冲区
        this.addLogEntry(level, args);
      };
    };

    global.logger.info = captureLogger('info', originalLogger.info);
    global.logger.error = captureLogger('error', originalLogger.error);
    global.logger.warn = captureLogger('warn', originalLogger.warn);
    global.logger.debug = captureLogger('debug', originalLogger.debug);
    global.logger.trace = captureLogger('trace', originalLogger.trace);
    global.logger.mark = captureLogger('mark', originalLogger.mark);
  }

  /**
   * 添加日志条目
   * @param {string} level 日志级别
   * @param {Array} args 日志参数
   */
  addLogEntry(level, args) {
    const entry = {
      timestamp: Date.now(),
      level: level,
      message: args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' '),
      raw: args
    };

    this.logBuffer.push(entry);

    // 保持缓冲区大小
    if (this.logBuffer.length > this.maxLogBufferSize) {
      this.logBuffer.shift();
    }
  }

  /**
   * 获取日志
   * @param {Object} data 查询参数
   * @returns {Object} 日志数据
   */
  async getLogs(data = {}) {
    try {
      const { 
        lines = 100, 
        level, 
        search, 
        since, 
        includeRaw = false 
      } = data;

      let logs = [...this.logBuffer];

      // 时间过滤
      if (since) {
        const sinceTime = new Date(since).getTime();
        logs = logs.filter(log => log.timestamp >= sinceTime);
      }

      // 级别过滤
      if (level) {
        logs = logs.filter(log => log.level === level);
      }

      // 搜索过滤
      if (search) {
        const searchLower = search.toLowerCase();
        logs = logs.filter(log => 
          log.message.toLowerCase().includes(searchLower)
        );
      }

      // 限制行数
      logs = logs.slice(-lines);

      // 格式化输出
      const formattedLogs = logs.map(log => {
        const formatted = {
          timestamp: log.timestamp,
          time: new Date(log.timestamp).toISOString(),
          level: log.level,
          message: log.message
        };

        if (includeRaw) {
          formatted.raw = log.raw;
        }

        return formatted;
      });

      return {
        success: true,
        action: 'logs.get',
        data: {
          logs: formattedLogs,
          total: this.logBuffer.length,
          filtered: logs.length,
          parameters: {
            lines,
            level,
            search,
            since,
            includeRaw
          },
          timestamp: Date.now()
        },
        timestamp: Date.now(),
        responseTime: 1
      };
    } catch (error) {
      logger.error('[MCP Handler] 获取日志失败:', error);
      return {
        success: false,
        action: 'logs.get',
        error: error.message,
        timestamp: Date.now()
      };
    }
  }

  /**
   * 清空日志缓冲区
   * @returns {Object} 清空结果
   */
  async clearLogs() {
    try {
      const clearedCount = this.logBuffer.length;
      this.logBuffer = [];

      return {
        success: true,
        action: 'logs.clear',
        data: {
          clearedCount: clearedCount,
          timestamp: Date.now()
        },
        timestamp: Date.now(),
        responseTime: 1
      };
    } catch (error) {
      logger.error('[MCP Handler] 清空日志失败:', error);
      return {
        success: false,
        action: 'logs.clear',
        error: error.message,
        timestamp: Date.now()
      };
    }
  }

  /**
   * 获取日志统计信息
   * @returns {Object} 统计信息
   */
  async getLogStats() {
    try {
      const stats = {
        total: this.logBuffer.length,
        byLevel: {},
        recent: {
          last1min: 0,
          last5min: 0,
          last1hour: 0
        }
      };

      const now = Date.now();
      const oneMinute = 60 * 1000;
      const fiveMinutes = 5 * 60 * 1000;
      const oneHour = 60 * 60 * 1000;

      // 统计各级别日志数量和时间分布
      for (const log of this.logBuffer) {
        // 按级别统计
        stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1;

        // 按时间统计
        const age = now - log.timestamp;
        if (age <= oneMinute) {
          stats.recent.last1min++;
        }
        if (age <= fiveMinutes) {
          stats.recent.last5min++;
        }
        if (age <= oneHour) {
          stats.recent.last1hour++;
        }
      }

      return {
        success: true,
        action: 'logs.stats',
        data: {
          stats: stats,
          bufferSize: this.maxLogBufferSize,
          timestamp: Date.now()
        },
        timestamp: Date.now(),
        responseTime: 1
      };
    } catch (error) {
      logger.error('[MCP Handler] 获取日志统计失败:', error);
      return {
        success: false,
        action: 'logs.stats',
        error: error.message,
        timestamp: Date.now()
      };
    }
  }

  /**
   * 设置日志级别过滤
   * @param {Object} data 设置参数
   * @returns {Object} 设置结果
   */
  async setLogLevel(data) {
    try {
      const { level } = data;
      
      if (!level) {
        throw new Error('缺少必要参数: level');
      }

      const validLevels = ['debug', 'info', 'warn', 'error', 'trace', 'mark'];
      if (!validLevels.includes(level)) {
        throw new Error(`无效的日志级别: ${level}，支持的级别: ${validLevels.join(', ')}`);
      }

      // 更新配置
      if (!this.config.mcp) this.config.mcp = {};
      if (!this.config.mcp.debug) this.config.mcp.debug = {};
      this.config.mcp.debug.logLevel = level;

      return {
        success: true,
        action: 'logs.setLevel',
        data: {
          level: level,
          validLevels: validLevels,
          timestamp: Date.now()
        },
        timestamp: Date.now(),
        responseTime: 1
      };
    } catch (error) {
      logger.error('[MCP Handler] 设置日志级别失败:', error);
      return {
        success: false,
        action: 'logs.setLevel',
        error: error.message,
        timestamp: Date.now()
      };
    }
  }

  /**
   * 导出日志
   * @param {Object} data 导出参数
   * @returns {Object} 导出结果
   */
  async exportLogs(data = {}) {
    try {
      const { 
        format = 'json', 
        level, 
        search, 
        since 
      } = data;

      let logs = [...this.logBuffer];

      // 应用过滤器
      if (since) {
        const sinceTime = new Date(since).getTime();
        logs = logs.filter(log => log.timestamp >= sinceTime);
      }

      if (level) {
        logs = logs.filter(log => log.level === level);
      }

      if (search) {
        const searchLower = search.toLowerCase();
        logs = logs.filter(log => 
          log.message.toLowerCase().includes(searchLower)
        );
      }

      let exportData;
      if (format === 'json') {
        exportData = JSON.stringify(logs, null, 2);
      } else if (format === 'csv') {
        const headers = 'timestamp,time,level,message\n';
        const rows = logs.map(log => 
          `${log.timestamp},"${new Date(log.timestamp).toISOString()}","${log.level}","${log.message.replace(/"/g, '""')}"`
        ).join('\n');
        exportData = headers + rows;
      } else if (format === 'text') {
        exportData = logs.map(log => 
          `[${new Date(log.timestamp).toISOString()}] ${log.level.toUpperCase()}: ${log.message}`
        ).join('\n');
      } else {
        throw new Error(`不支持的导出格式: ${format}`);
      }

      return {
        success: true,
        action: 'logs.export',
        data: {
          format: format,
          count: logs.length,
          data: exportData,
          timestamp: Date.now()
        },
        timestamp: Date.now(),
        responseTime: 1
      };
    } catch (error) {
      logger.error('[MCP Handler] 导出日志失败:', error);
      return {
        success: false,
        action: 'logs.export',
        error: error.message,
        timestamp: Date.now()
      };
    }
  }

  /**
   * 恢复原始的 console 方法
   */
  restoreConsole() {
    if (this.originalConsole) {
      console.log = this.originalConsole.log;
      console.error = this.originalConsole.error;
      console.warn = this.originalConsole.warn;
      console.info = this.originalConsole.info;
      console.debug = this.originalConsole.debug;
    }
  }
}
// @ts-nocheck
