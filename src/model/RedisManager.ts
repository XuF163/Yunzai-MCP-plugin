// @ts-nocheck
/**
 * Redis 数据库管理模块
 * 负责 Redis 数据的增删改查等操作
 */

export class RedisManager {
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
   * 获取 Redis 值
   * @param {Object} data 查询参数
   * @returns {Object} 查询结果
   */
  async get(data) {
    this.checkPermission('allowRedisRead');

    const { key } = data;
    
    if (!key) {
      throw new Error('缺少必要参数: key');
    }

    try {
      const value = await redis.get(key);
      
      return {
        success: true,
        action: 'redis.get',
        data: {
          key: key,
          value: value,
          exists: value !== null,
          type: value !== null ? typeof value : null,
          timestamp: Date.now()
        },
        timestamp: Date.now(),
        responseTime: 1
      };
    } catch (error) {
      logger.error('[MCP Handler] Redis GET 失败:', error);
      return {
        success: false,
        action: 'redis.get',
        error: error.message,
        timestamp: Date.now()
      };
    }
  }

  /**
   * 设置 Redis 值
   * @param {Object} data 设置参数
   * @returns {Object} 设置结果
   */
  async set(data) {
    this.checkPermission('allowRedisWrite');

    const { key, value, expire } = data;
    
    if (!key || value === undefined) {
      throw new Error('缺少必要参数: key 和 value');
    }

    try {
      let result;
      if (expire && expire > 0) {
        // 设置带过期时间的值 - 使用 Yunzai 的 setEx 方法
        result = await redis.setEx(key, expire, value);
      } else {
        // 设置永久值
        result = await redis.set(key, value);
      }
      
      return {
        success: true,
        action: 'redis.set',
        data: {
          key: key,
          value: value,
          expire: expire || null,
          result: result,
          timestamp: Date.now()
        },
        timestamp: Date.now(),
        responseTime: 1
      };
    } catch (error) {
      logger.error('[MCP Handler] Redis SET 失败:', error);
      return {
        success: false,
        action: 'redis.set',
        error: error.message,
        timestamp: Date.now()
      };
    }
  }

  /**
   * 删除 Redis 键
   * @param {Object} data 删除参数
   * @returns {Object} 删除结果
   */
  async del(data) {
    this.checkPermission('allowRedisWrite');

    const { key, keys } = data;
    
    if (!key && !keys) {
      throw new Error('缺少必要参数: key 或 keys');
    }

    try {
      let result;
      if (keys && Array.isArray(keys)) {
        // 删除多个键
        result = await redis.del(...keys);
      } else {
        // 删除单个键
        result = await redis.del(key);
      }
      
      return {
        success: true,
        action: 'redis.del',
        data: {
          key: key,
          keys: keys,
          deletedCount: result,
          timestamp: Date.now()
        },
        timestamp: Date.now(),
        responseTime: 1
      };
    } catch (error) {
      logger.error('[MCP Handler] Redis DEL 失败:', error);
      return {
        success: false,
        action: 'redis.del',
        error: error.message,
        timestamp: Date.now()
      };
    }
  }

  /**
   * 查找 Redis 键
   * @param {Object} data 查找参数
   * @returns {Object} 查找结果
   */
  async keys(data) {
    this.checkPermission('allowRedisRead');

    const { pattern = '*', limit = 100 } = data;

    try {
      const keys = await redis.keys(pattern);
      
      // 限制返回数量
      const limitedKeys = keys.slice(0, limit);
      
      return {
        success: true,
        action: 'redis.keys',
        data: {
          pattern: pattern,
          keys: limitedKeys,
          total: keys.length,
          limited: keys.length > limit,
          limit: limit,
          timestamp: Date.now()
        },
        timestamp: Date.now(),
        responseTime: 1
      };
    } catch (error) {
      logger.error('[MCP Handler] Redis KEYS 失败:', error);
      return {
        success: false,
        action: 'redis.keys',
        error: error.message,
        timestamp: Date.now()
      };
    }
  }

  /**
   * 获取 Redis 信息
   * @returns {Object} Redis 信息
   */
  async info() {
    this.checkPermission('allowRedisRead');

    try {
      const info = await redis.info();
      const dbSize = await redis.dbsize();
      const memory = await redis.info('memory');
      
      // 解析 Redis 信息
      const parseInfo = (infoStr) => {
        const result = {};
        const lines = infoStr.split('\r\n');
        
        for (const line of lines) {
          if (line && !line.startsWith('#') && line.includes(':')) {
            const [key, value] = line.split(':');
            result[key] = isNaN(value) ? value : Number(value);
          }
        }
        
        return result;
      };
      
      const parsedInfo = parseInfo(info);
      const parsedMemory = parseInfo(memory);
      
      return {
        success: true,
        action: 'redis.info',
        data: {
          server: {
            version: parsedInfo.redis_version,
            mode: parsedInfo.redis_mode,
            os: parsedInfo.os,
            uptime: parsedInfo.uptime_in_seconds
          },
          clients: {
            connected: parsedInfo.connected_clients,
            blocked: parsedInfo.blocked_clients
          },
          memory: {
            used: parsedMemory.used_memory,
            used_human: parsedMemory.used_memory_human,
            peak: parsedMemory.used_memory_peak,
            peak_human: parsedMemory.used_memory_peak_human
          },
          stats: {
            total_connections: parsedInfo.total_connections_received,
            total_commands: parsedInfo.total_commands_processed,
            keyspace_hits: parsedInfo.keyspace_hits,
            keyspace_misses: parsedInfo.keyspace_misses
          },
          database: {
            size: dbSize,
            keys: parsedInfo.db0 ? parsedInfo.db0.split(',')[0].split('=')[1] : 0
          },
          timestamp: Date.now()
        },
        timestamp: Date.now(),
        responseTime: 1
      };
    } catch (error) {
      logger.error('[MCP Handler] Redis INFO 失败:', error);
      return {
        success: false,
        action: 'redis.info',
        error: error.message,
        timestamp: Date.now()
      };
    }
  }

  /**
   * 检查 Redis 键是否存在
   * @param {Object} data 检查参数
   * @returns {Object} 检查结果
   */
  async exists(data) {
    this.checkPermission('allowRedisRead');

    const { key, keys } = data;
    
    if (!key && !keys) {
      throw new Error('缺少必要参数: key 或 keys');
    }

    try {
      let result;
      if (keys && Array.isArray(keys)) {
        // 检查多个键
        result = await redis.exists(...keys);
      } else {
        // 检查单个键
        result = await redis.exists(key);
      }
      
      return {
        success: true,
        action: 'redis.exists',
        data: {
          key: key,
          keys: keys,
          exists: result > 0,
          count: result,
          timestamp: Date.now()
        },
        timestamp: Date.now(),
        responseTime: 1
      };
    } catch (error) {
      logger.error('[MCP Handler] Redis EXISTS 失败:', error);
      return {
        success: false,
        action: 'redis.exists',
        error: error.message,
        timestamp: Date.now()
      };
    }
  }

  /**
   * 获取 Redis 键的 TTL
   * @param {Object} data 查询参数
   * @returns {Object} TTL 结果
   */
  async ttl(data) {
    this.checkPermission('allowRedisRead');

    const { key } = data;
    
    if (!key) {
      throw new Error('缺少必要参数: key');
    }

    try {
      const ttl = await redis.ttl(key);
      
      let status;
      if (ttl === -2) {
        status = 'not_exists';
      } else if (ttl === -1) {
        status = 'no_expire';
      } else {
        status = 'has_expire';
      }
      
      return {
        success: true,
        action: 'redis.ttl',
        data: {
          key: key,
          ttl: ttl,
          status: status,
          expires_at: ttl > 0 ? Date.now() + (ttl * 1000) : null,
          timestamp: Date.now()
        },
        timestamp: Date.now(),
        responseTime: 1
      };
    } catch (error) {
      logger.error('[MCP Handler] Redis TTL 失败:', error);
      return {
        success: false,
        action: 'redis.ttl',
        error: error.message,
        timestamp: Date.now()
      };
    }
  }

  /**
   * 设置 Redis 键的过期时间
   * @param {Object} data 设置参数
   * @returns {Object} 设置结果
   */
  async expire(data) {
    this.checkPermission('allowRedisWrite');

    const { key, seconds } = data;
    
    if (!key || !seconds) {
      throw new Error('缺少必要参数: key 和 seconds');
    }

    try {
      const result = await redis.expire(key, seconds);
      
      return {
        success: true,
        action: 'redis.expire',
        data: {
          key: key,
          seconds: seconds,
          success: result === 1,
          expires_at: Date.now() + (seconds * 1000),
          timestamp: Date.now()
        },
        timestamp: Date.now(),
        responseTime: 1
      };
    } catch (error) {
      logger.error('[MCP Handler] Redis EXPIRE 失败:', error);
      return {
        success: false,
        action: 'redis.expire',
        error: error.message,
        timestamp: Date.now()
      };
    }
  }
}
// @ts-nocheck
