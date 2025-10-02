// @ts-nocheck
/**
 * 系统监控模块
 * 负责系统信息收集、性能监控等功能
 */

import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import os from 'node:os';

const execAsync = promisify(exec);

export class SystemMonitor {
  constructor(config) {
    this.config = config;
  }

  /**
   * 获取系统信息
   * @returns {Object} 系统信息
   */
  async getSystemInfo() {
    try {
      const systemInfo = {
        // 基本系统信息
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version,
        hostname: os.hostname(),
        
        // CPU 信息
        cpu: {
          model: os.cpus()[0]?.model || 'unknown',
          cores: os.cpus().length,
          speed: os.cpus()[0]?.speed || 0,
          architecture: os.arch()
        },
        
        // 内存信息
        memory: {
          total: os.totalmem(),
          free: os.freemem(),
          used: os.totalmem() - os.freemem(),
          usage: ((os.totalmem() - os.freemem()) / os.totalmem() * 100).toFixed(2)
        },
        
        // 系统运行时间
        uptime: {
          system: os.uptime(),
          process: process.uptime()
        },
        
        // 网络接口
        network: this.getNetworkInterfaces(),
        
        // 用户信息
        user: os.userInfo(),
        
        // 系统负载（仅 Unix 系统）
        loadavg: process.platform !== 'win32' ? os.loadavg() : null,
        
        // 临时目录
        tmpdir: os.tmpdir(),
        
        // 主目录
        homedir: os.homedir()
      };

      return {
        success: true,
        action: 'system.info',
        data: systemInfo,
        timestamp: Date.now(),
        responseTime: 1
      };
    } catch (error) {
      logger.error('[MCP Handler] 获取系统信息失败:', error);
      return {
        success: false,
        action: 'system.info',
        error: error.message,
        timestamp: Date.now()
      };
    }
  }

  /**
   * 获取网络接口信息
   * @returns {Object} 网络接口信息
   */
  getNetworkInterfaces() {
    const interfaces = os.networkInterfaces();
    const result = {};
    
    for (const [name, addresses] of Object.entries(interfaces)) {
      result[name] = addresses.map(addr => ({
        address: addr.address,
        family: addr.family,
        internal: addr.internal,
        mac: addr.mac
      }));
    }
    
    return result;
  }

  /**
   * 获取系统统计信息
   * @returns {Object} 系统统计
   */
  async getSystemStats() {
    try {
      const stats = {
        // 进程信息
        process: {
          pid: process.pid,
          ppid: process.ppid,
          memory: process.memoryUsage(),
          cpu: process.cpuUsage(),
          uptime: process.uptime(),
          version: process.version,
          versions: process.versions
        },
        
        // 系统资源
        system: {
          platform: process.platform,
          arch: process.arch,
          cpus: os.cpus().length,
          memory: {
            total: os.totalmem(),
            free: os.freemem(),
            used: os.totalmem() - os.freemem()
          },
          uptime: os.uptime(),
          loadavg: process.platform !== 'win32' ? os.loadavg() : null
        },
        
        // 环境变量统计
        env: {
          count: Object.keys(process.env).length,
          nodeEnv: process.env.NODE_ENV || 'unknown',
          path: process.env.PATH ? process.env.PATH.split(process.platform === 'win32' ? ';' : ':').length : 0
        }
      };

      // 获取磁盘使用情况（如果可能）
      try {
        if (process.platform !== 'win32') {
          const { stdout } = await execAsync('df -h /');
          stats.disk = this.parseDiskUsage(stdout);
        } else {
          const { stdout } = await execAsync('wmic logicaldisk get size,freespace,caption');
          stats.disk = this.parseWindowsDiskUsage(stdout);
        }
      } catch (error) {
        stats.disk = { error: 'Unable to get disk usage' };
      }

      return {
        success: true,
        action: 'system.stats',
        data: stats,
        timestamp: Date.now(),
        responseTime: 1
      };
    } catch (error) {
      logger.error('[MCP Handler] 获取系统统计失败:', error);
      return {
        success: false,
        action: 'system.stats',
        error: error.message,
        timestamp: Date.now()
      };
    }
  }

  /**
   * 解析磁盘使用情况（Unix）
   * @param {string} output df 命令输出
   * @returns {Object} 磁盘使用情况
   */
  parseDiskUsage(output) {
    const lines = output.trim().split('\n');
    if (lines.length < 2) return { error: 'Invalid df output' };
    
    const data = lines[1].split(/\s+/);
    return {
      filesystem: data[0],
      size: data[1],
      used: data[2],
      available: data[3],
      usage: data[4],
      mountpoint: data[5]
    };
  }

  /**
   * 解析磁盘使用情况（Windows）
   * @param {string} output wmic 命令输出
   * @returns {Array} 磁盘使用情况
   */
  parseWindowsDiskUsage(output) {
    const lines = output.trim().split('\n').slice(1); // 跳过标题行
    const disks = [];
    
    for (const line of lines) {
      const data = line.trim().split(/\s+/);
      if (data.length >= 3) {
        disks.push({
          caption: data[0],
          freeSpace: parseInt(data[1]) || 0,
          size: parseInt(data[2]) || 0
        });
      }
    }
    
    return disks;
  }

  /**
   * 获取进程列表
   * @param {Object} data 查询参数
   * @returns {Object} 进程列表
   */
  async getProcesses(data = {}) {
    try {
      const { limit = 20, sortBy = 'cpu' } = data;
      
      let command;
      if (process.platform === 'win32') {
        command = 'tasklist /fo csv';
      } else {
        command = 'ps aux --sort=-%cpu';
      }
      
      const { stdout } = await execAsync(command);
      const processes = this.parseProcessList(stdout, process.platform);
      
      // 排序和限制
      let sortedProcesses = processes;
      if (sortBy === 'cpu') {
        sortedProcesses = processes.sort((a, b) => (b.cpu || 0) - (a.cpu || 0));
      } else if (sortBy === 'memory') {
        sortedProcesses = processes.sort((a, b) => (b.memory || 0) - (a.memory || 0));
      }
      
      const limitedProcesses = sortedProcesses.slice(0, limit);
      
      return {
        success: true,
        action: 'system.processes',
        data: {
          processes: limitedProcesses,
          total: processes.length,
          limit: limit,
          sortBy: sortBy,
          timestamp: Date.now()
        },
        timestamp: Date.now(),
        responseTime: 1
      };
    } catch (error) {
      logger.error('[MCP Handler] 获取进程列表失败:', error);
      return {
        success: false,
        action: 'system.processes',
        error: error.message,
        timestamp: Date.now()
      };
    }
  }

  /**
   * 解析进程列表
   * @param {string} output 命令输出
   * @param {string} platform 平台
   * @returns {Array} 进程列表
   */
  parseProcessList(output, platform) {
    const lines = output.trim().split('\n');
    const processes = [];
    
    if (platform === 'win32') {
      // Windows tasklist 输出
      for (let i = 1; i < lines.length; i++) {
        const data = lines[i].split(',').map(s => s.replace(/"/g, ''));
        if (data.length >= 5) {
          processes.push({
            name: data[0],
            pid: parseInt(data[1]) || 0,
            sessionName: data[2],
            sessionNumber: data[3],
            memory: data[4]
          });
        }
      }
    } else {
      // Unix ps 输出
      for (let i = 1; i < lines.length; i++) {
        const data = lines[i].trim().split(/\s+/);
        if (data.length >= 11) {
          processes.push({
            user: data[0],
            pid: parseInt(data[1]) || 0,
            cpu: parseFloat(data[2]) || 0,
            memory: parseFloat(data[3]) || 0,
            vsz: parseInt(data[4]) || 0,
            rss: parseInt(data[5]) || 0,
            tty: data[6],
            stat: data[7],
            start: data[8],
            time: data[9],
            command: data.slice(10).join(' ')
          });
        }
      }
    }
    
    return processes;
  }

  /**
   * 获取内存使用详情
   * @returns {Object} 内存使用详情
   */
  async getMemoryInfo() {
    try {
      const processMemory = process.memoryUsage();
      const systemMemory = {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem()
      };
      
      const memoryInfo = {
        process: {
          rss: processMemory.rss,
          heapTotal: processMemory.heapTotal,
          heapUsed: processMemory.heapUsed,
          external: processMemory.external,
          arrayBuffers: processMemory.arrayBuffers
        },
        system: {
          total: systemMemory.total,
          free: systemMemory.free,
          used: systemMemory.used,
          usage: (systemMemory.used / systemMemory.total * 100).toFixed(2)
        },
        formatted: {
          process: {
            rss: this.formatBytes(processMemory.rss),
            heapTotal: this.formatBytes(processMemory.heapTotal),
            heapUsed: this.formatBytes(processMemory.heapUsed),
            external: this.formatBytes(processMemory.external),
            arrayBuffers: this.formatBytes(processMemory.arrayBuffers)
          },
          system: {
            total: this.formatBytes(systemMemory.total),
            free: this.formatBytes(systemMemory.free),
            used: this.formatBytes(systemMemory.used)
          }
        }
      };
      
      return {
        success: true,
        action: 'memory.info',
        data: memoryInfo,
        timestamp: Date.now(),
        responseTime: 1
      };
    } catch (error) {
      logger.error('[MCP Handler] 获取内存信息失败:', error);
      return {
        success: false,
        action: 'memory.info',
        error: error.message,
        timestamp: Date.now()
      };
    }
  }

  /**
   * 格式化字节数
   * @param {number} bytes 字节数
   * @returns {string} 格式化后的字符串
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * 获取性能指标
   * @returns {Object} 性能指标
   */
  async getPerformanceMetrics() {
    try {
      const startTime = process.hrtime.bigint();
      
      // 模拟一些计算来测试性能
      let sum = 0;
      for (let i = 0; i < 1000000; i++) {
        sum += Math.random();
      }
      
      const endTime = process.hrtime.bigint();
      const executionTime = Number(endTime - startTime) / 1000000; // 转换为毫秒
      
      const metrics = {
        cpu: {
          usage: process.cpuUsage(),
          loadavg: process.platform !== 'win32' ? os.loadavg() : null
        },
        memory: process.memoryUsage(),
        performance: {
          executionTime: executionTime,
          eventLoopDelay: this.measureEventLoopDelay()
        },
        uptime: {
          process: process.uptime(),
          system: os.uptime()
        }
      };
      
      return {
        success: true,
        action: 'system.performance',
        data: metrics,
        timestamp: Date.now(),
        responseTime: 1
      };
    } catch (error) {
      logger.error('[MCP Handler] 获取性能指标失败:', error);
      return {
        success: false,
        action: 'system.performance',
        error: error.message,
        timestamp: Date.now()
      };
    }
  }

  /**
   * 测量事件循环延迟
   * @returns {Promise<number>} 延迟时间（毫秒）
   */
  measureEventLoopDelay() {
    return new Promise((resolve) => {
      const start = process.hrtime.bigint();
      setImmediate(() => {
        const delay = Number(process.hrtime.bigint() - start) / 1000000;
        resolve(delay);
      });
    });
  }
}
// @ts-nocheck
