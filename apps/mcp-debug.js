import yaml from 'js-yaml';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default class MCPDebug extends plugin {
  constructor() {
    super({
      name: 'MCP调试',
      dsc: 'MCP插件调试和测试功能',
      event: 'message',
      priority: 500,
      rule: [
        {
          reg: '^(#|\/)?mcp\s*调试$',
          fnc: 'showDebugMenu'
        },
        {
          reg: '^(#|\/)?mcp\s*内存$',
          fnc: 'showMemoryInfo'
        },
        {
          reg: '^(#|\/)?mcp\s*性能$',
          fnc: 'showPerformanceInfo'
        },
        {
          reg: '^(#|\/)?mcp\s*事件\s*(.+)$',
          fnc: 'sendTestEvent'
        },
        {
          reg: '^(#|\/)?mcp\s*消息\s*(.+)$',
          fnc: 'sendTestMessage'
        },
        {
          reg: '^(#|\/)?mcp\s*redis\s*(.+)$',
          fnc: 'testRedis'
        },
        {
          reg: '^(#|\/)?mcp\s*api\s*(.+)$',
          fnc: 'testAPI'
        },
        {
          reg: '^(#|\/)?mcp\s*广播\s*(.+)$',
          fnc: 'broadcastMessage'
        },
        {
          reg: '^(#|\/)?mcp\s*压测$',
          fnc: 'stressTest'
        }
      ]
    });

    logger.info('[MCP Debug] MCP调试插件已加载');
  }

  async showDebugMenu(e) {
    const debugMsg = [
      '=== MCP调试菜单 ===',
      '#mcp内存 - 显示内存使用情况',
      '#mcp性能 - 显示性能信息',
      '#mcp事件 <类型> - 发送测试事件',
      '#mcp消息 <内容> - 发送测试消息',
      '#mcp redis <命令> - 测试Redis操作',
      '#mcp api <动作> - 测试API调用',
      '#mcp广播 <消息> - 广播消息给所有客户端',
      '#mcp压测 - 运行压力测试',
      '',
      '示例:',
      '#mcp事件 test',
      '#mcp消息 Hello World',
      '#mcp redis get test_key',
      '#mcp api bot.status',
      '#mcp广播 系统通知'
    ];

    await e.reply(debugMsg.join('\n'), true);
    return true;
  }

  async showMemoryInfo(e) {
    try {
      const memUsage = process.memoryUsage();
      const formatBytes = (bytes) => {
        const mb = bytes / 1024 / 1024;
        return `${Math.round(mb * 100) / 100} MB`;
      };

      const memoryMsg = [
        '=== 内存使用情况 ===',
        `RSS (常驻内存): ${formatBytes(memUsage.rss)}`,
        `堆总大小: ${formatBytes(memUsage.heapTotal)}`,
        `堆已使用: ${formatBytes(memUsage.heapUsed)}`,
        `外部内存: ${formatBytes(memUsage.external)}`,
        `数组缓冲区: ${formatBytes(memUsage.arrayBuffers)}`,
        '',
        `堆使用率: ${Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100)}%`,
        '',
        '=== 系统信息 ===',
        `Node.js版本: ${process.version}`,
        `平台: ${process.platform}`,
        `架构: ${process.arch}`,
        `运行时间: ${this.formatUptime(process.uptime() * 1000)}`
      ];

      await e.reply(memoryMsg.join('\n'), true);
    } catch (error) {
      await e.reply(`获取内存信息失败: ${error.message}`, true);
    }
    return true;
  }

  async showPerformanceInfo(e) {
    try {
      const cpuUsage = process.cpuUsage();
      const startTime = Date.now();
      
      // 简单的性能测试
      let testResult = 0;
      for (let i = 0; i < 100000; i++) {
        testResult += Math.random();
      }
      
      const endTime = Date.now();
      const testDuration = endTime - startTime;
      
      const performanceMsg = [
        '=== 性能信息 ===',
        `CPU用户时间: ${Math.round(cpuUsage.user / 1000)} ms`,
        `CPU系统时间: ${Math.round(cpuUsage.system / 1000)} ms`,
        `进程运行时间: ${this.formatUptime(process.uptime() * 1000)}`,
        '',
        '=== 性能测试 ===',
        `计算测试耗时: ${testDuration} ms`,
        `测试结果: ${Math.round(testResult)}`,
        '',
        '=== Bot状态 ===',
        `在线Bot数量: ${Object.keys(Bot.bots).length}`,
        `MCP客户端数量: ${global.mcpServer?.clients?.size || 0}`,
        `事件监听器数量: ${Bot.listenerCount('message')}`
      ];

      await e.reply(performanceMsg.join('\n'), true);
    } catch (error) {
      await e.reply(`获取性能信息失败: ${error.message}`, true);
    }
    return true;
  }

  async sendTestEvent(e) {
    try {
      const eventType = e.msg.match(/mcp\s*事件\s*(.+)$/)?.[1]?.trim();
      if (!eventType) {
        await e.reply('请指定事件类型，例如: #mcp事件 test', true);
        return true;
      }

      const testEventData = {
        type: eventType,
        source: 'mcp-debug',
        timestamp: Date.now(),
        user_id: e.user_id,
        group_id: e.group_id,
        data: {
          message: `测试事件: ${eventType}`,
          sender: e.sender
        }
      };

      // 发送事件
      Bot.emit(eventType, testEventData);
      
      // 如果有MCP客户端，也广播给它们
      if (global.mcpServer) {
        global.mcpServer.broadcast({
          type: 'test_event',
          eventType,
          data: testEventData
        });
      }

      const resultMsg = [
        '✅ 测试事件已发送',
        `事件类型: ${eventType}`,
        `时间戳: ${new Date(testEventData.timestamp).toLocaleString()}`,
        `数据: ${JSON.stringify(testEventData.data, null, 2)}`
      ];

      await e.reply(resultMsg.join('\n'), true);
    } catch (error) {
      await e.reply(`发送测试事件失败: ${error.message}`, true);
    }
    return true;
  }

  async sendTestMessage(e) {
    try {
      const message = e.msg.match(/mcp\s*消息\s*(.+)$/)?.[1]?.trim();
      if (!message) {
        await e.reply('请指定消息内容，例如: #mcp消息 Hello World', true);
        return true;
      }

      const testMessageData = {
        message_type: e.group_id ? 'group' : 'private',
        user_id: e.user_id,
        group_id: e.group_id,
        message,
        raw_message: message,
        time: Math.floor(Date.now() / 1000),
        sender: {
          ...e.sender,
          nickname: e.sender.nickname || 'MCP测试用户'
        },
        source: 'mcp-debug'
      };

      // 发送消息事件
      Bot.emit('message', testMessageData);
      
      // 广播给MCP客户端
      if (global.mcpServer) {
        global.mcpServer.broadcast({
          type: 'test_message',
          data: testMessageData
        });
      }

      const resultMsg = [
        '✅ 测试消息已发送',
        `消息内容: ${message}`,
        `消息类型: ${testMessageData.message_type}`,
        `发送者: ${testMessageData.sender.nickname}`,
        `时间: ${new Date(testMessageData.time * 1000).toLocaleString()}`
      ];

      await e.reply(resultMsg.join('\n'), true);
    } catch (error) {
      await e.reply(`发送测试消息失败: ${error.message}`, true);
    }
    return true;
  }

  async testRedis(e) {
    try {
      const command = e.msg.match(/mcp\s*redis\s*(.+)$/)?.[1]?.trim();
      if (!command) {
        await e.reply('请指定Redis命令，例如: #mcp redis get test_key', true);
        return true;
      }

      const [action, key, value] = command.split(' ');
      let result;

      switch (action.toLowerCase()) {
        case 'get':
          result = await redis.get(key);
          break;
        case 'set':
          if (!value) {
            await e.reply('SET命令需要指定值，例如: #mcp redis set test_key test_value', true);
            return true;
          }
          result = await redis.set(key, value);
          break;
        case 'del':
          result = await redis.del(key);
          break;
        case 'keys':
          result = await redis.keys(key || '*');
          break;
        case 'info':
          result = await redis.info();
          break;
        default:
          await e.reply(`不支持的Redis命令: ${action}`, true);
          return true;
      }

      const resultMsg = [
        '✅ Redis命令执行成功',
        `命令: ${command}`,
        `结果: ${JSON.stringify(result, null, 2)}`,
        `时间: ${new Date().toLocaleString()}`
      ];

      await e.reply(resultMsg.join('\n'), true);
    } catch (error) {
      await e.reply(`Redis命令执行失败: ${error.message}`, true);
    }
    return true;
  }

  async testAPI(e) {
    try {
      const action = e.msg.match(/mcp\s*api\s*(.+)$/)?.[1]?.trim();
      if (!action) {
        await e.reply('请指定API动作，例如: #mcp api bot.status', true);
        return true;
      }

      // 模拟API调用
      if (!global.mcpServer?.handler) {
        await e.reply('❌ MCP服务器未运行', true);
        return true;
      }

      const startTime = Date.now();
      const result = await global.mcpServer.handler.handleAction(action, {}, {
        source: 'debug',
        user_id: e.user_id
      });
      const endTime = Date.now();

      const resultMsg = [
        '✅ API调用成功',
        `动作: ${action}`,
        `耗时: ${endTime - startTime} ms`,
        `结果: ${JSON.stringify(result, null, 2)}`,
        `时间: ${new Date().toLocaleString()}`
      ];

      await e.reply(resultMsg.join('\n'), true);
    } catch (error) {
      await e.reply(`API调用失败: ${error.message}`, true);
    }
    return true;
  }

  async broadcastMessage(e) {
    try {
      const message = e.msg.match(/mcp\s*广播\s*(.+)$/)?.[1]?.trim();
      if (!message) {
        await e.reply('请指定广播消息，例如: #mcp广播 系统通知', true);
        return true;
      }

      if (!global.mcpServer) {
        await e.reply('❌ MCP服务器未运行', true);
        return true;
      }

      const broadcastData = {
        type: 'system_broadcast',
        message,
        sender: e.sender.nickname || '系统',
        timestamp: Date.now(),
        source: 'mcp-debug'
      };

      global.mcpServer.broadcast(broadcastData);

      const resultMsg = [
        '✅ 广播消息已发送',
        `消息: ${message}`,
        `客户端数量: ${global.mcpServer.clients?.size || 0}`,
        `时间: ${new Date().toLocaleString()}`
      ];

      await e.reply(resultMsg.join('\n'), true);
    } catch (error) {
      await e.reply(`广播消息失败: ${error.message}`, true);
    }
    return true;
  }

  async stressTest(e) {
    try {
      await e.reply('🔄 开始压力测试...', true);
      
      const startTime = Date.now();
      const testCount = 100;
      const results = {
        success: 0,
        failed: 0,
        totalTime: 0,
        minTime: Infinity,
        maxTime: 0
      };

      // 并发测试API调用
      const promises = [];
      for (let i = 0; i < testCount; i++) {
        promises.push(this.performStressTestCall(i));
      }

      const testResults = await Promise.allSettled(promises);
      
      testResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.success++;
          const time = result.value.time;
          results.totalTime += time;
          results.minTime = Math.min(results.minTime, time);
          results.maxTime = Math.max(results.maxTime, time);
        } else {
          results.failed++;
        }
      });

      const endTime = Date.now();
      const totalDuration = endTime - startTime;
      const avgTime = results.success > 0 ? results.totalTime / results.success : 0;

      const stressTestMsg = [
        '=== 压力测试结果 ===',
        `总测试数: ${testCount}`,
        `成功: ${results.success}`,
        `失败: ${results.failed}`,
        `成功率: ${Math.round((results.success / testCount) * 100)}%`,
        '',
        '=== 性能指标 ===',
        `总耗时: ${totalDuration} ms`,
        `平均响应时间: ${Math.round(avgTime)} ms`,
        `最快响应: ${results.minTime === Infinity ? 'N/A' : results.minTime} ms`,
        `最慢响应: ${results.maxTime} ms`,
        `QPS: ${Math.round((results.success / totalDuration) * 1000)}`,
        '',
        '✅ 压力测试完成'
      ];

      await e.reply(stressTestMsg.join('\n'), true);
    } catch (error) {
      await e.reply(`压力测试失败: ${error.message}`, true);
    }
    return true;
  }

  async performStressTestCall(index) {
    const startTime = Date.now();
    
    try {
      if (!global.mcpServer?.handler) {
        throw new Error('MCP服务器未运行');
      }

      // 测试不同的API调用
      const actions = ['bot.status', 'debug.memory', 'debug.performance'];
      const action = actions[index % actions.length];
      
      await global.mcpServer.handler.handleAction(action, {}, {
        source: 'stress_test',
        index
      });
      
      const endTime = Date.now();
      return { time: endTime - startTime, success: true };
    } catch (error) {
      const endTime = Date.now();
      return { time: endTime - startTime, success: false, error: error.message };
    }
  }

  formatUptime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days}天 ${hours % 24}小时 ${minutes % 60}分钟`;
    } else if (hours > 0) {
      return `${hours}小时 ${minutes % 60}分钟`;
    } else if (minutes > 0) {
      return `${minutes}分钟 ${seconds % 60}秒`;
    } else {
      return `${seconds}秒`;
    }
  }
}
