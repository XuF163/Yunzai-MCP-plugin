// yunzai-mcp-plugin/index.js
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import { MCPServer } from './lib/MCPServer.js';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pluginName = path.basename(__dirname);

logger.info(`[${pluginName} Index] __dirname is: ${__dirname}`);

const appsPath = path.join(__dirname, 'apps');

// --- 配置文件路径定义 ---
const configDir = path.join(__dirname, 'config');
const defaultConfigPath = path.join(configDir, 'defSet.yaml');
const userConfigPath = path.join(configDir, 'config.yaml');

// MCP服务器实例和进程
let mcpServer = null;
let mcpProcess = null;

// --- 自动复制配置文件的逻辑 ---
try {
  if (!fs.existsSync(userConfigPath)) {
    logger.info(`[${pluginName}] 未找到用户配置文件 ${userConfigPath}，尝试从默认配置复制...`);
    
    if (fs.existsSync(defaultConfigPath)) {
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }
      fs.copyFileSync(defaultConfigPath, userConfigPath);
      logger.info(`[${pluginName}] 成功将 ${defaultConfigPath} 复制到 ${userConfigPath}`);
    } else {
      logger.warn(`[${pluginName}] 警告：默认配置文件 ${defaultConfigPath} 不存在，无法自动创建用户配置！`);
    }
  } else {
    logger.debug(`[${pluginName}] 用户配置文件 ${userConfigPath} 已存在。`);
  }
} catch (error) {
  logger.error(`[${pluginName}] 自动处理配置文件时出错:`, error);
}

// 启动独立的MCP服务器进程
function startMCPProcess() {
    try {
        const mcpServerPath = path.join(__dirname, 'mcp-server.js');
        
        logger.info(`[${pluginName}] 启动独立MCP服务器进程...`);
        
        mcpProcess = spawn('node', [mcpServerPath], {
            stdio: ['pipe', 'pipe', 'pipe'],
            cwd: __dirname
        });
        
        mcpProcess.stdout.on('data', (data) => {
            logger.debug(`[${pluginName} MCP Server] stdout:`, data.toString().trim());
        });
        
        mcpProcess.stderr.on('data', (data) => {
            const message = data.toString().trim();
            if (message) {
                try {
                    const logEntry = JSON.parse(message);
                    logger.info(`[${pluginName} MCP Server] ${logEntry.level}: ${logEntry.message}`);
                } catch {
                    logger.debug(`[${pluginName} MCP Server] stderr:`, message);
                }
            }
        });
        
        mcpProcess.on('close', (code) => {
            logger.warn(`[${pluginName} MCP Server] 进程退出，代码: ${code}`);
            mcpProcess = null;
        });
        
        mcpProcess.on('error', (error) => {
            logger.error(`[${pluginName} MCP Server] 进程错误:`, error);
            mcpProcess = null;
        });
        
        logger.info(`[${pluginName}] 独立MCP服务器进程已启动`);
        
    } catch (error) {
        logger.error(`[${pluginName}] 启动MCP服务器进程失败:`, error);
    }
}

// 停止MCP服务器进程
function stopMCPProcess() {
    if (mcpProcess) {
        logger.info(`[${pluginName}] 停止MCP服务器进程...`);
        mcpProcess.kill('SIGTERM');
        mcpProcess = null;
    }
}

// --- 启动MCP服务器 ---
try {
  // 创建并启动HTTP MCP服务器
  mcpServer = new MCPServer();
  await mcpServer.start();
  
  // 设置全局引用，供其他模块访问
  global.mcpServer = mcpServer;
  
  // 启动独立的MCP服务器进程（用于IDE连接）
  startMCPProcess();
  
  logger.info(`[${pluginName}] MCP服务器已启动`);
} catch (error) {
  logger.error(`[${pluginName}] MCP服务器启动失败:`, error);
}

// 插件销毁函数
export async function destroy() {
    try {
        // 停止HTTP服务器
        if (mcpServer) {
            await mcpServer.stop();
            mcpServer = null;
        }
        
        // 停止MCP服务器进程
        stopMCPProcess();
        
        logger.info(`[${pluginName}] 已停止`);
    } catch (error) {
        logger.error(`[${pluginName}] 停止时出错:`, error);
    }
}

// --- 动态加载应用文件 ---
const _path = process.cwd().replace(/\\/g, '/');

const files = [
  'mcp-control.js',
  'mcp-debug.js'
];

let ret = [];

files.forEach((v) => {
  ret.push(import(`file://${_path}/plugins/Yunzai-MCP-plugin/apps/${v}?${Date.now()}`));
});

ret = await Promise.allSettled(ret);

let apps = {};
for (let i in files) {
  let name = files[i].replace('.js', '');

  if (ret[i].status != 'fulfilled') {
    logger.error(`[${pluginName}] 载入插件错误：${logger.red(name)}`);
    logger.error(ret[i].reason);
    continue;
  }
  apps[name] = ret[i].value[Object.keys(ret[i].value)[0]];
}

export { apps, mcpServer, stopMCPProcess };