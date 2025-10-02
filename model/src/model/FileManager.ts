// @ts-nocheck
/**
 * 文件管理模块
 * 负责文件的保存、读取、删除等操作
 */

import fs from 'node:fs/promises';
import path from 'node:path';

export class FileManager {
  constructor(config) {
    this.config = config;
    this.baseDir = 'data/mcp_client';
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
   * 确保目录存在
   * @param {string} dirPath 目录路径
   */
  async ensureDir(dirPath) {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
      if (error.code !== 'EEXIST') {
        throw error;
      }
    }
  }

  /**
   * 保存图片文件
   * @param {Buffer} buffer 图片数据
   * @param {string} filePath 文件路径
   * @returns {Object} 保存结果
   */
  async saveImageFile(buffer, filePath) {
    try {
      // 确保目录存在
      const dir = path.dirname(filePath);
      await this.ensureDir(dir);

      // 保存文件
      await fs.writeFile(filePath, buffer);
      
      // 获取文件信息
      const stats = await fs.stat(filePath);
      
      logger.debug(`[MCP] 图片文件已保存: ${filePath}`);
      
      return {
        success: true,
        action: 'file.save',
        data: {
          path: filePath,
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime,
          timestamp: Date.now()
        },
        timestamp: Date.now()
      };
    } catch (error) {
      logger.error(`[MCP] 保存图片文件失败: ${filePath}`, error);
      throw error;
    }
  }

  /**
   * 保存图片文件并注册到HTTP服务器
   * @param {Buffer} buffer 图片数据
   * @param {string} filePath 文件路径
   * @param {string} fileName 文件名
   * @returns {string} 文件URL
   */
  async saveImageFileAndRegister(buffer, filePath, fileName) {
    try {
      // 确保目录存在
      const dir = path.dirname(filePath);
      await this.ensureDir(dir);

      // 保存文件到磁盘
      await fs.writeFile(filePath, buffer);
      logger.debug(`[MCP] 图片文件已保存: ${filePath}`);

      // 使用 Bot.fileToUrl 注册文件到HTTP服务器
      const fileUrl = await Bot.fileToUrl(buffer, { name: fileName });
      logger.debug(`[MCP] 图片文件已注册到HTTP服务器: ${fileUrl}`);

      return fileUrl;
    } catch (error) {
      logger.error(`[MCP] 保存或注册图片文件失败: ${filePath}`, error);
      throw error;
    }
  }

  /**
   * 读取文件
   * @param {Object} data 读取参数
   * @returns {Object} 文件内容
   */
  async readFile(data) {
    this.checkPermission('allowFileRead');

    const { path: filePath, encoding = 'utf8' } = data;
    
    if (!filePath) {
      throw new Error('缺少必要参数: path');
    }

    try {
      // 安全检查：确保文件路径在允许的目录内
      const safePath = path.resolve(filePath);
      const baseDir = path.resolve(this.baseDir);
      
      if (!safePath.startsWith(baseDir)) {
        throw new Error('文件路径不在允许的目录内');
      }

      const content = await fs.readFile(safePath, encoding);
      const stats = await fs.stat(safePath);
      
      return {
        success: true,
        action: 'file.read',
        data: {
          path: filePath,
          content: content,
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime,
          encoding: encoding,
          timestamp: Date.now()
        },
        timestamp: Date.now()
      };
    } catch (error) {
      logger.error('[MCP Handler] 读取文件失败:', error);
      return {
        success: false,
        action: 'file.read',
        error: error.message,
        timestamp: Date.now()
      };
    }
  }

  /**
   * 写入文件
   * @param {Object} data 写入参数
   * @returns {Object} 写入结果
   */
  async writeFile(data) {
    this.checkPermission('allowFileWrite');

    const { path: filePath, content, encoding = 'utf8' } = data;
    
    if (!filePath || content === undefined) {
      throw new Error('缺少必要参数: path 和 content');
    }

    try {
      // 安全检查：确保文件路径在允许的目录内
      const safePath = path.resolve(filePath);
      const baseDir = path.resolve(this.baseDir);
      
      if (!safePath.startsWith(baseDir)) {
        throw new Error('文件路径不在允许的目录内');
      }

      // 确保目录存在
      await this.ensureDir(path.dirname(safePath));

      // 写入文件
      await fs.writeFile(safePath, content, encoding);
      const stats = await fs.stat(safePath);
      
      return {
        success: true,
        action: 'file.write',
        data: {
          path: filePath,
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime,
          encoding: encoding,
          timestamp: Date.now()
        },
        timestamp: Date.now()
      };
    } catch (error) {
      logger.error('[MCP Handler] 写入文件失败:', error);
      return {
        success: false,
        action: 'file.write',
        error: error.message,
        timestamp: Date.now()
      };
    }
  }

  /**
   * 删除文件
   * @param {Object} data 删除参数
   * @returns {Object} 删除结果
   */
  async deleteFile(data) {
    this.checkPermission('allowFileWrite');

    const { path: filePath } = data;
    
    if (!filePath) {
      throw new Error('缺少必要参数: path');
    }

    try {
      // 安全检查：确保文件路径在允许的目录内
      const safePath = path.resolve(filePath);
      const baseDir = path.resolve(this.baseDir);
      
      if (!safePath.startsWith(baseDir)) {
        throw new Error('文件路径不在允许的目录内');
      }

      // 检查文件是否存在
      const stats = await fs.stat(safePath);
      
      // 删除文件
      await fs.unlink(safePath);
      
      return {
        success: true,
        action: 'file.delete',
        data: {
          path: filePath,
          size: stats.size,
          deleted: true,
          timestamp: Date.now()
        },
        timestamp: Date.now()
      };
    } catch (error) {
      logger.error('[MCP Handler] 删除文件失败:', error);
      return {
        success: false,
        action: 'file.delete',
        error: error.message,
        timestamp: Date.now()
      };
    }
  }

  /**
   * 列出目录内容
   * @param {Object} data 列表参数
   * @returns {Object} 目录内容
   */
  async listDirectory(data) {
    this.checkPermission('allowFileRead');

    const { path: dirPath = this.baseDir, recursive = false } = data;

    try {
      // 安全检查：确保目录路径在允许的目录内
      const safePath = path.resolve(dirPath);
      const baseDir = path.resolve(this.baseDir);
      
      if (!safePath.startsWith(baseDir)) {
        throw new Error('目录路径不在允许的目录内');
      }

      const items = [];
      
      const readDir = async (currentPath, depth = 0) => {
        const entries = await fs.readdir(currentPath, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(currentPath, entry.name);
          const relativePath = path.relative(baseDir, fullPath);
          const stats = await fs.stat(fullPath);
          
          const item = {
            name: entry.name,
            path: relativePath,
            type: entry.isDirectory() ? 'directory' : 'file',
            size: stats.size,
            created: stats.birthtime,
            modified: stats.mtime,
            depth: depth
          };
          
          items.push(item);
          
          // 递归读取子目录
          if (recursive && entry.isDirectory() && depth < 3) {
            await readDir(fullPath, depth + 1);
          }
        }
      };
      
      await readDir(safePath);
      
      return {
        success: true,
        action: 'file.list',
        data: {
          path: dirPath,
          recursive: recursive,
          items: items,
          count: items.length,
          timestamp: Date.now()
        },
        timestamp: Date.now()
      };
    } catch (error) {
      logger.error('[MCP Handler] 列出目录失败:', error);
      return {
        success: false,
        action: 'file.list',
        error: error.message,
        timestamp: Date.now()
      };
    }
  }

  /**
   * 获取文件信息
   * @param {Object} data 查询参数
   * @returns {Object} 文件信息
   */
  async getFileInfo(data) {
    this.checkPermission('allowFileRead');

    const { path: filePath } = data;
    
    if (!filePath) {
      throw new Error('缺少必要参数: path');
    }

    try {
      // 安全检查：确保文件路径在允许的目录内
      const safePath = path.resolve(filePath);
      const baseDir = path.resolve(this.baseDir);
      
      if (!safePath.startsWith(baseDir)) {
        throw new Error('文件路径不在允许的目录内');
      }

      const stats = await fs.stat(safePath);
      
      return {
        success: true,
        action: 'file.info',
        data: {
          path: filePath,
          type: stats.isDirectory() ? 'directory' : 'file',
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime,
          accessed: stats.atime,
          permissions: stats.mode,
          timestamp: Date.now()
        },
        timestamp: Date.now()
      };
    } catch (error) {
      logger.error('[MCP Handler] 获取文件信息失败:', error);
      return {
        success: false,
        action: 'file.info',
        error: error.message,
        timestamp: Date.now()
      };
    }
  }
}
// @ts-nocheck
