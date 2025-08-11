import yaml from 'js-yaml';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default class MCPControl extends plugin {
  constructor() {
    super({
      name: 'MCP控制',
      dsc: 'MCP插件控制和状态管理',
      event: 'message',
      priority: 500,
      rule: [
        {
          reg: '^(#|\/)?mcp$',
          fnc: 'showHelp'
        },
        {
          reg: '^(#|\/)?mcp\s*状态$',
          fnc: 'showStatus'
        },
        {
          reg: '^(#|\/)?mcp\s*测试$',
          fnc: 'runTest'
        },
        {
          reg: '^(#|\/)?mcp\s*配置$',
          fnc: 'showConfig'
        },
        {
          reg: '^(#|\/)?mcp\s*重载$',
          fnc: 'reloadConfig'
        },
        {
          reg: '^(#|\/)?mcp\s*客户端$',
          fnc: 'showClients'
        },
        {
          reg: '^(#|\/)?mcp\s*日志$',
          fnc: 'showLogs'
        }
      ]
    });

    logger.info('[MCP Control] MCP控制插件已加载');
  }

  async showHelp(e) {
    const helpMsg = [
      '=== MCP插件帮助 ===',
      '#mcp - 显示此帮助',
      '#mcp状态 - 显示MCP服务器状态',
      '#mcp测试 - 运行连接测试',
      '#mcp配置 - 显示当前配置',
      '#mcp重载 - 重载配置文件',
      '#mcp客户端 - 显示连接的客户端',
      '#mcp日志 - 显示最近的日志',
      '',
      'MCP API端点:',
      `http://localhost:${Bot.server.address()?.port || '未知'}/MCP/health`,
      `ws://localhost:${Bot.server.address()?.port || '未知'}/MCP/ws`,
      '',
      '支持的API动作:',
      '• bot.* - Bot控制 (restart, shutdown, status, info)',
      '• message.* - 消息操作 (send, recall, history)',
      '• redis.* - Redis操作 (get, set, del, keys, info)',
      '• plugin.* - 插件管理 (list, info, reload)',
      '• file.* - 文件操作 (read, write, list, delete)',
      '• command.execute - 命令执行',
      '• test.* - 测试功能 (event, message)',
      '• debug.* - 调试信息 (logs, memory, performance)'
    ];

    await e.reply(helpMsg.join('\n'), true);
    return true;
  }

  async showStatus(e) {
    try {
      const config = this.loadConfig();
      const serverStatus = global.mcpServer?.getStatus() || { running: false };
      
      const statusMsg = [
        '=== MCP服务器状态 ===',
        `状态: ${serverStatus.running ? '✅ 运行中' : '❌ 未运行'}`,
        `连接客户端: ${serverStatus.clients || 0}`,
        `请求历史: ${serverStatus.requestHistory || 0}`,
        `运行时间: ${this.formatUptime(serverStatus.uptime || 0)}`,
        '',
        '=== Bot状态 ===',
        `在线Bot数量: ${Object.keys(Bot.bots).length}`,
        `当前UIN: ${Bot.uin.toString()}`,
        `内存使用: ${this.formatMemory(process.memoryUsage().heapUsed)}`,
        '',
        '=== 配置状态 ===',
        `MCP服务: ${config.mcp?.server?.enabled ? '✅ 启用' : '❌ 禁用'}`,
        `API路径: ${config.mcp?.server?.path || '/MCP'}`,
        `详细日志: ${config.mcp?.server?.verbose ? '✅ 启用' : '❌ 禁用'}`,
        '',
        '=== 权限配置 ===',
        `Bot控制: ${config.mcp?.permissions?.allowRestart ? '✅' : '❌'}`,
        `Redis访问: ${config.mcp?.permissions?.allowRedis ? '✅' : '❌'}`,
        `消息操作: ${config.mcp?.permissions?.allowSendMessage ? '✅' : '❌'}`,
        `文件操作: ${config.mcp?.permissions?.allowFileOperations ? '✅' : '❌'}`,
        `命令执行: ${config.mcp?.permissions?.allowCommandExecution ? '✅' : '❌'}`
      ];

      await e.reply(statusMsg.join('\n'), true);
    } catch (error) {
      await e.reply(`获取状态失败: ${error.message}`, true);
    }
    return true;
  }

  async runTest(e) {
    try {
      const config = this.loadConfig();
      const port = Bot.server.address()?.port || 2536;
      const testUrl = `http://localhost:${port}${config.mcp?.server?.path || '/MCP'}/health`;
      
      // 测试健康检查端点
      const fetch = (await import('node-fetch')).default;
      const response = await fetch(testUrl);
      const data = await response.json();
      
      const testMsg = [
        '=== MCP连接测试 ===',
        `测试URL: ${testUrl}`,
        `响应状态: ${response.status} ${response.statusText}`,
        `服务状态: ${data.status}`,
        `Bot UIN: ${data.bot_status?.uin}`,
        `Bot在线: ${data.bot_status?.online ? '✅' : '❌'}`,
        `时间戳: ${new Date(data.timestamp).toLocaleString()}`,
        '',
        '✅ MCP服务器连接正常！'
      ];
      
      await e.reply(testMsg.join('\n'), true);
    } catch (error) {
      const errorMsg = [
        '=== MCP连接测试 ===',
        '❌ 连接测试失败！',
        `错误信息: ${error.message}`,
        '',
        '请检查:',
        '1. MCP服务器是否启动',
        '2. 端口是否正确',
        '3. 配置文件是否正确'
      ];
      
      await e.reply(errorMsg.join('\n'), true);
    }
    return true;
  }

  async showConfig(e) {
    try {
      const config = this.loadConfig();
      const configStr = yaml.dump(config.mcp || {}, { indent: 2 });
      
      const configMsg = [
        '=== MCP当前配置 ===',
        '```yaml',
        configStr,
        '```',
        '',
        '配置文件位置:',
        path.join(__dirname, '../config/config.yaml')
      ];
      
      await e.reply(configMsg.join('\n'), true);
    } catch (error) {
      await e.reply(`获取配置失败: ${error.message}`, true);
    }
    return true;
  }

  async reloadConfig(e) {
    try {
      // 重新加载配置（这里需要重启MCP服务器）
      if (global.mcpServer) {
        global.mcpServer.config = global.mcpServer.loadConfig();
        await e.reply('✅ MCP配置已重载', true);
      } else {
        await e.reply('❌ MCP服务器未运行，无法重载配置', true);
      }
    } catch (error) {
      await e.reply(`重载配置失败: ${error.message}`, true);
    }
    return true;
  }

  async showClients(e) {
    try {
      const serverStatus = global.mcpServer?.getStatus() || { running: false };
      
      if (!serverStatus.running) {
        await e.reply('❌ MCP服务器未运行', true);
        return true;
      }
      
      const clients = global.mcpServer?.clients || new Map();
      
      if (clients.size === 0) {
        await e.reply('📱 当前没有连接的客户端', true);
        return true;
      }
      
      const clientList = [];
      clients.forEach((client, clientId) => {
        const connectedTime = new Date(client.connected).toLocaleString();
        const lastActivity = new Date(client.lastActivity).toLocaleString();
        
        clientList.push([
          `客户端ID: ${clientId}`,
          `连接时间: ${connectedTime}`,
          `最后活动: ${lastActivity}`,
          '---'
        ].join('\n'));
      });
      
      const clientMsg = [
        `=== 连接的客户端 (${clients.size}) ===`,
        '',
        ...clientList
      ];
      
      await e.reply(clientMsg.join('\n'), true);
    } catch (error) {
      await e.reply(`获取客户端信息失败: ${error.message}`, true);
    }
    return true;
  }

  async showLogs(e) {
    try {
      const serverStatus = global.mcpServer?.getStatus() || { running: false };
      
      if (!serverStatus.running) {
        await e.reply('❌ MCP服务器未运行', true);
        return true;
      }
      
      const requestHistory = global.mcpServer?.requestHistory || [];
      const recentLogs = requestHistory.slice(-10); // 最近10条
      
      if (recentLogs.length === 0) {
        await e.reply('📝 暂无请求日志', true);
        return true;
      }
      
      const logList = recentLogs.map(log => {
        const time = new Date(log.timestamp).toLocaleString();
        return `[${time}] ${log.action} - ${log.ip}`;
      });
      
      const logMsg = [
        `=== 最近的MCP请求日志 ===`,
        '',
        ...logList,
        '',
        `总请求数: ${requestHistory.length}`
      ];
      
      await e.reply(logMsg.join('\n'), true);
    } catch (error) {
      await e.reply(`获取日志失败: ${error.message}`, true);
    }
    return true;
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
      logger.error('[MCP Control] 配置文件加载失败:', error);
      return { mcp: { server: { enabled: false } } };
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

  formatMemory(bytes) {
    const mb = bytes / 1024 / 1024;
    return `${Math.round(mb * 100) / 100} MB`;
  }
}