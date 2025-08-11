import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs/promises';
import path from 'node:path';

const execAsync = promisify(exec);

export class MCPHandler {
  constructor(config) {
    this.config = config;
    this.eventListeners = new Map();
    this.setupEventListeners();
    this.setupActionMap();
  }

  setupActionMap() {
    this.actionMap = {
      'bot.shutdown': this.handleBotShutdown.bind(this),
      'bot.status': this.handleBotStatus.bind(this),
      'bot.info': this.handleBotInfo.bind(this),
      'send.message': this.handleSendMessage.bind(this),
      'send.friend': this.handleSendFriendMessage.bind(this),
      'send.group': this.handleSendGroupMessage.bind(this),
      'recall.message': this.handleRecallMessage.bind(this),
      'message.history': this.handleMessageHistory.bind(this),
      'message.get': this.handleGetMessage.bind(this),
      'message.forward': this.handleGetForwardMessage.bind(this),
      'test.message': this.handleTestMessage.bind(this),
      'debug.logs': this.handleDebugLogs.bind(this),
      'debug.memory': this.handleDebugMemory.bind(this)
    };
  }

  setupEventListeners() {
    // 监听Bot消息事件
    Bot.on('message', (data) => {
      this.broadcastEvent('message', data);
    });

    // 监听Bot通知事件
    Bot.on('notice', (data) => {
      this.broadcastEvent('notice', data);
    });

    // 监听Bot请求事件
    Bot.on('request', (data) => {
      this.broadcastEvent('request', data);
    });
  }

  async handleAction(action, data, context) {
    logger.info(`[MCP Handler] 处理动作: ${action}`);

    switch (action) {
      // Bot控制相关
      case 'bot.restart':
        return await this.handleBotRestart(data);
      case 'bot.shutdown':
        return await this.handleBotShutdown(data);
      case 'bot.status':
        return await this.handleBotStatus();
      case 'bot.info':
        return await this.handleBotInfo();

      // 消息相关
      case 'message.send':
        return await this.handleSendMessage(data);
      case 'message.recall':
        return await this.handleRecallMessage(data);
      case 'message.history':
        return await this.handleMessageHistory(data);

      // Redis相关
      case 'redis.get':
        return await this.handleRedisGet(data);
      case 'redis.set':
        return await this.handleRedisSet(data);
      case 'redis.del':
        return await this.handleRedisDel(data);
      case 'redis.keys':
        return await this.handleRedisKeys(data);
      case 'redis.info':
        return await this.handleRedisInfo();

      // 插件相关
      case 'plugin.list':
        return await this.handlePluginList();
      case 'plugin.info':
        return await this.handlePluginInfo(data);
      case 'plugin.reload':
        return await this.handlePluginReload(data);
      case 'plugin.disable':
        return await this.handlePluginDisable(data);
      case 'plugin.enable':
        return await this.handlePluginEnable(data);

      // 文件操作相关
      case 'file.read':
        return await this.handleFileRead(data);
      case 'file.write':
        return await this.handleFileWrite(data);
      case 'file.list':
        return await this.handleFileList(data);
      case 'file.delete':
        return await this.handleFileDelete(data);

      // 命令执行相关
      case 'command.execute':
        return await this.handleCommandExecute(data);

      // 测试相关
      case 'test.event':
        return await this.handleTestEvent(data);
      case 'test.message':
        return await this.handleTestMessage(data);

      // 调试相关
      case 'debug.logs':
        return await this.handleDebugLogs(data);
      case 'debug.memory':
      case 'memory.info':
        return await this.handleDebugMemory();
      case 'debug.performance':
        return await this.handleDebugPerformance();

      // 系统监控相关
      case 'system.info':
        return await this.handleSystemInfo();
      case 'system.stats':
        return await this.handleSystemStats();
      case 'system.processes':
        return await this.handleSystemProcesses();

      // 网络相关
      case 'network.ping':
        return await this.handleNetworkPing(data);
      case 'network.request':
        return await this.handleNetworkRequest(data);
      case 'network.download':
        return await this.handleNetworkDownload(data);

      // 数据库相关
      case 'database.query':
        return await this.handleDatabaseQuery(data);
      case 'database.backup':
        return await this.handleDatabaseBackup(data);
      case 'database.restore':
        return await this.handleDatabaseRestore(data);

      // 任务调度相关
      case 'scheduler.add':
        return await this.handleSchedulerAdd(data);
      case 'scheduler.remove':
        return await this.handleSchedulerRemove(data);
      case 'scheduler.list':
        return await this.handleSchedulerList();

      // 用户管理相关
      case 'user.info':
        return await this.handleUserInfo(data);
      case 'user.list':
        return await this.handleUserList(data);
      case 'user.ban':
        return await this.handleUserBan(data);
      case 'user.unban':
        return await this.handleUserUnban(data);

      // 群组管理相关
      case 'group.info':
        return await this.handleGroupInfo(data);
      case 'group.list':
        return await this.handleGroupList();
      case 'group.members':
        return await this.handleGroupMembers(data);
      case 'group.kick':
        return await this.handleGroupKick(data);
      case 'group.mute':
        return await this.handleGroupMute(data);
      case 'group.unmute':
        return await this.handleGroupUnmute(data);

      // AI相关
      case 'ai.chat':
        return await this.handleAIChat(data);
      case 'ai.image':
        return await this.handleAIImage(data);
      case 'ai.translate':
        return await this.handleAITranslate(data);

      // 媒体处理相关
      case 'media.convert':
        return await this.handleMediaConvert(data);
      case 'media.compress':
        return await this.handleMediaCompress(data);
      case 'media.info':
        return await this.handleMediaInfo(data);

      default:
        throw new Error(`未知的动作: ${action}`);
    }
  }

  // Bot控制方法
  async handleBotRestart(data) {
    this.checkPermission('allowRestart');
    
    logger.info('[MCP Handler] 执行Bot重启');
    
    // 延迟执行重启，给响应时间
    setTimeout(() => {
      process.exit(0);
    }, 1000);
    
    return { message: 'Bot重启命令已发送', timestamp: Date.now() };
  }

  async handleBotShutdown(data) {
    this.checkPermission('allowShutdown');
    
    logger.info('[MCP Handler] 执行Bot关闭');
    
    setTimeout(() => {
      process.exit(0);
    }, 1000);
    
    return { message: 'Bot关闭命令已发送', timestamp: Date.now() };
  }

  async handleBotStatus() {
    return {
      online: Object.keys(Bot.bots).length > 0,
      bots: Object.keys(Bot.bots),
      uin: Bot.uin.toString(),
      uptime: Date.now() - (Bot.stat?.start_time * 1000 || Date.now()),
      memory: process.memoryUsage(),
      version: process.version,
      platform: process.platform
    };
  }

  async handleBotInfo() {
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

  // 消息相关方法
  
  /**
   * 解析消息格式，参考OneBotv11适配器的parseMsg方法
   * @param {Array|Object} msg 消息内容
   * @returns {Array} 解析后的消息数组
   */
  parseMessage(msg) {
    const array = [];
    for (const i of Array.isArray(msg) ? msg : [msg]) {
      if (typeof i === "object" && i.type) {
        array.push({ ...i.data, type: i.type });
      } else {
        array.push({ type: "text", text: String(i) });
      }
    }
    return array;
  }

  /**
   * 构建消息格式，参考OneBotv11适配器的makeMsg方法
   * @param {Array|Object|String} msg 原始消息
   * @returns {Array} 格式化后的消息数组
   */
  async makeMessage(msg) {
    if (!Array.isArray(msg)) {
      msg = [msg];
    }
    
    const msgs = [];
    const forward = [];
    
    for (let i of msg) {
      if (typeof i !== "object") {
        i = { type: "text", data: { text: i } };
      } else if (!i.data) {
        i = { type: i.type, data: { ...i, type: undefined } };
      }

      switch (i.type) {
        case "at":
          i.data.qq = String(i.data.qq);
          break;
        case "reply":
          i.data.id = String(i.data.id);
          break;
        case "button":
          continue;
        case "node":
          forward.push(...i.data);
          continue;
        case "raw":
          i = i.data;
          break;
        case "image":
        case "record":
        case "video":
        case "file":
          if (i.data.file) {
            // 处理文件类型消息，可以在这里添加文件处理逻辑
            // 暂时保持原样
          }
          break;
      }

      msgs.push(i);
    }
    
    return [msgs, forward];
  }

  /**
   * 发送消息的核心方法
   * @param {Array|Object|String} msg 消息内容
   * @param {Function} send 发送函数
   * @param {Function} sendForwardMsg 转发消息函数
   * @returns {Object} 发送结果
   */
  async sendMessage(msg, send, sendForwardMsg) {
    const [message, forward] = await this.makeMessage(msg);
    const ret = [];

    if (forward.length) {
      const data = await sendForwardMsg(forward);
      if (Array.isArray(data)) {
        ret.push(...data);
      } else {
        ret.push(data);
      }
    }

    if (message.length) {
      ret.push(await send(message));
    }
    
    if (ret.length === 1) return ret[0];

    const message_id = [];
    for (const i of ret) {
      if (i?.message_id) {
        message_id.push(i.message_id);
      }
    }
    
    return { data: ret, message_id };
  }

  /**
   * 发送好友消息
   * @param {Object} data 消息数据
   * @returns {Object} 发送结果
   */
  async sendFriendMessage(data) {
    this.checkPermission('allowSendMessage');
    
    const { user_id, message, bot_id } = data;
    
    if (!user_id || !message) {
      throw new Error('缺少必要参数: user_id 和 message');
    }
    
    const bot = bot_id ? Bot.bots[bot_id] : Object.values(Bot.bots)[0];
    if (!bot) {
      throw new Error('未找到可用的Bot实例');
    }
    
    const friend = bot.pickFriend(user_id);
    const result = await this.sendMessage(message, 
      (msg) => friend.sendMsg(msg),
      (forwardMsg) => friend.sendForwardMsg(forwardMsg)
    );
    
    logger.info(`[MCP] 发送好友消息: ${bot.uin} => ${user_id}`);
    
    return {
      success: true,
      messageId: result.message_id || result.data?.[0]?.message_id,
      timestamp: Date.now(),
      type: 'private',
      target: user_id
    };
  }

  /**
   * 发送群消息
   * @param {Object} data 消息数据
   * @returns {Object} 发送结果
   */
  async sendGroupMessage(data) {
    this.checkPermission('allowSendMessage');
    
    const { group_id, message, bot_id } = data;
    
    if (!group_id || !message) {
      throw new Error('缺少必要参数: group_id 和 message');
    }
    
    const bot = bot_id ? Bot.bots[bot_id] : Object.values(Bot.bots)[0];
    if (!bot) {
      throw new Error('未找到可用的Bot实例');
    }

    const group = bot.pickGroup(group_id);
    const result = await this.sendMessage(message,
      (msg) => group.sendMsg(msg),
      (forwardMsg) => group.sendForwardMsg(forwardMsg)
    );
    
    logger.info(`[MCP] 发送群消息: ${bot.uin} => ${group_id}`);
    
    return {
      success: true,
      messageId: result.message_id || result.data?.[0]?.message_id,
      timestamp: Date.now(),
      type: 'group',
      target: group_id
    };
  }

  /**
   * 发送好友消息
   * @param {Object} data 消息数据
   * @returns {Object} 发送结果
   */
  async handleSendFriendMessage(data) {
    return await this.sendFriendMessage(data);
  }

  /**
   * 发送群消息
   * @param {Object} data 消息数据
   * @returns {Object} 发送结果
   */
  async handleSendGroupMessage(data) {
    return await this.sendGroupMessage(data);
  }

  /**
   * 统一的发送消息接口（兼容旧版本）
   * @param {Object} data 消息数据
   * @returns {Object} 发送结果
   */
  async handleSendMessage(data) {
    const { target, message, type = 'private', user_id, group_id, bot_id } = data;
    
    // 兼容新旧参数格式
    if (type === 'private' || user_id) {
      return await this.sendFriendMessage({
        user_id: user_id || target,
        message,
        bot_id
      });
    } else if (type === 'group' || group_id) {
      return await this.sendGroupMessage({
        group_id: group_id || target,
        message,
        bot_id
      });
    } else {
      throw new Error('无效的消息类型，支持: private, group');
    }
  }

  /**
   * 撤回消息
   * @param {Object} data 撤回数据
   * @returns {Object} 撤回结果
   */
  async handleRecallMessage(data) {
    this.checkPermission('allowSendMessage');
    
    const { messageId, message_id, target, type = 'private', user_id, group_id, bot_id } = data;
    const msgId = messageId || message_id;
    
    if (!msgId) {
      throw new Error('缺少必要参数: messageId 或 message_id');
    }
    
    const bot = bot_id ? Bot.bots[bot_id] : Object.values(Bot.bots)[0];
    if (!bot) {
      throw new Error('未找到可用的Bot实例');
    }
    
    let result;
    
    if (type === 'private' || user_id) {
      const friend = bot.pickFriend(user_id || target);
      result = await friend.recallMsg(msgId);
      logger.info(`[MCP] 撤回好友消息: ${bot.uin} => ${user_id || target}, ${msgId}`);
    } else if (type === 'group' || group_id) {
      const group = bot.pickGroup(group_id || target);
      result = await group.recallMsg(msgId);
      logger.info(`[MCP] 撤回群消息: ${bot.uin} => ${group_id || target}, ${msgId}`);
    } else {
      throw new Error('无效的消息类型，支持: private, group');
    }
    
    return { 
      success: true, 
      messageId: msgId,
      result,
      timestamp: Date.now() 
    };
  }

  /**
   * 获取消息历史记录
   * @param {Object} data 查询数据
   * @returns {Object} 历史记录
   */
  async handleMessageHistory(data) {
    this.checkPermission('allowReceiveMessage');
    
    const { target, type = 'private', count = 20, message_seq, user_id, group_id, bot_id } = data;
    
    const bot = bot_id ? Bot.bots[bot_id] : Object.values(Bot.bots)[0];
    if (!bot) {
      throw new Error('未找到可用的Bot实例');
    }
    
    let history;
    
    try {
      if (type === 'private' || user_id) {
        const targetId = user_id || target;
        if (bot.adapter?.getFriendMsgHistory) {
          history = await bot.adapter.getFriendMsgHistory({
            bot,
            user_id: targetId
          }, message_seq || 0, count);
        } else {
          // 如果适配器不支持历史记录，返回空数组
          history = [];
        }
        logger.info(`[MCP] 获取好友消息历史: ${bot.uin} => ${targetId}`);
      } else if (type === 'group' || group_id) {
        const targetId = group_id || target;
        if (bot.adapter?.getGroupMsgHistory) {
          history = await bot.adapter.getGroupMsgHistory({
            bot,
            group_id: targetId
          }, message_seq || 0, count);
        } else {
          // 如果适配器不支持历史记录，返回空数组
          history = [];
        }
        logger.info(`[MCP] 获取群消息历史: ${bot.uin} => ${targetId}`);
      } else {
        throw new Error('无效的消息类型，支持: private, group');
      }
    } catch (error) {
      logger.error(`[MCP] 获取消息历史失败: ${error.message}`);
      history = [];
    }
    
    return { 
      history: history || [], 
      count: history?.length || 0,
      type,
      target: user_id || group_id || target,
      timestamp: Date.now() 
    };
  }

  /**
   * 获取指定消息详情
   * @param {Object} data 查询数据
   * @returns {Object} 消息详情
   */
  async handleGetMessage(data) {
    this.checkPermission('allowReceiveMessage');
    
    const { messageId, message_id, bot_id } = data;
    const msgId = messageId || message_id;
    
    if (!msgId) {
      throw new Error('缺少必要参数: messageId 或 message_id');
    }
    
    const bot = bot_id ? Bot.bots[bot_id] : Object.values(Bot.bots)[0];
    if (!bot) {
      throw new Error('未找到可用的Bot实例');
    }
    
    try {
      let message;
      if (bot.adapter?.getMsg) {
        message = await bot.adapter.getMsg({ bot }, msgId);
      } else {
        throw new Error('当前适配器不支持获取消息详情');
      }
      
      logger.info(`[MCP] 获取消息详情: ${bot.uin} => ${msgId}`);
      
      return {
        success: true,
        message,
        messageId: msgId,
        timestamp: Date.now()
      };
    } catch (error) {
      logger.error(`[MCP] 获取消息详情失败: ${error.message}`);
      return {
        success: false,
        error: error.message,
        messageId: msgId,
        timestamp: Date.now()
      };
    }
  }

  /**
   * 获取转发消息内容
   * @param {Object} data 查询数据
   * @returns {Object} 转发消息内容
   */
  async handleGetForwardMessage(data) {
    this.checkPermission('allowReceiveMessage');
    
    const { messageId, message_id, bot_id } = data;
    const msgId = messageId || message_id;
    
    if (!msgId) {
      throw new Error('缺少必要参数: messageId 或 message_id');
    }
    
    const bot = bot_id ? Bot.bots[bot_id] : Object.values(Bot.bots)[0];
    if (!bot) {
      throw new Error('未找到可用的Bot实例');
    }
    
    try {
      let forwardMsg;
      if (bot.adapter?.getForwardMsg) {
        forwardMsg = await bot.adapter.getForwardMsg({ bot }, msgId);
      } else {
        throw new Error('当前适配器不支持获取转发消息');
      }
      
      logger.info(`[MCP] 获取转发消息: ${bot.uin} => ${msgId}`);
      
      return {
        success: true,
        forwardMsg,
        messageId: msgId,
        timestamp: Date.now()
      };
    } catch (error) {
      logger.error(`[MCP] 获取转发消息失败: ${error.message}`);
      return {
        success: false,
        error: error.message,
        messageId: msgId,
        timestamp: Date.now()
      };
    }
  }

  // Redis相关方法
  async handleRedisGet(data) {
    this.checkPermission('allowRedis');
    
    const { key } = data;
    if (!key) throw new Error('缺少参数: key');
    
    const value = await redis.get(key);
    return { key, value, timestamp: Date.now() };
  }

  async handleRedisSet(data) {
    this.checkPermission('allowRedis');
    
    const { key, value, expire } = data;
    if (!key || value === undefined) {
      throw new Error('缺少参数: key 和 value');
    }
    
    if (expire) {
      await redis.setEx(key, expire, value);
    } else {
      await redis.set(key, value);
    }
    
    return { success: true, key, timestamp: Date.now() };
  }

  async handleRedisDel(data) {
    this.checkPermission('allowRedis');
    
    const { key } = data;
    if (!key) throw new Error('缺少参数: key');
    
    const result = await redis.del(key);
    return { deleted: result, key, timestamp: Date.now() };
  }

  async handleRedisKeys(data) {
    this.checkPermission('allowRedis');
    
    const { pattern = '*' } = data;
    const keys = await redis.keys(pattern);
    return { keys, pattern, count: keys.length, timestamp: Date.now() };
  }

  async handleRedisInfo() {
    this.checkPermission('allowRedis');
    
    const info = await redis.info();
    return { info, timestamp: Date.now() };
  }

  // 插件相关方法
  async handlePluginList() {
    this.checkPermission('allowPluginAccess');
    
    const plugins = [];
    
    // 获取插件信息（这里需要根据实际的插件管理器实现）
    // 暂时返回基本信息
    return {
      plugins,
      count: plugins.length,
      timestamp: Date.now()
    };
  }

  async handlePluginInfo(data) {
    this.checkPermission('allowPluginAccess');
    
    const { pluginName } = data;
    if (!pluginName) throw new Error('缺少参数: pluginName');
    
    // 获取特定插件信息
    return {
      name: pluginName,
      // 其他插件信息
      timestamp: Date.now()
    };
  }

  // 文件操作方法
  async handleFileRead(data) {
    this.checkPermission('allowFileOperations');
    
    const { filePath, encoding = 'utf8' } = data;
    if (!filePath) throw new Error('缺少参数: filePath');
    
    const content = await fs.readFile(filePath, encoding);
    return {
      filePath,
      content,
      size: content.length,
      timestamp: Date.now()
    };
  }

  async handleFileWrite(data) {
    this.checkPermission('allowFileOperations');
    
    const { filePath, content, encoding = 'utf8' } = data;
    if (!filePath || content === undefined) {
      throw new Error('缺少参数: filePath 和 content');
    }
    
    await fs.writeFile(filePath, content, encoding);
    return {
      success: true,
      filePath,
      size: content.length,
      timestamp: Date.now()
    };
  }

  async handleFileList(data) {
    this.checkPermission('allowFileOperations');
    
    const { dirPath = './' } = data;
    
    const files = await fs.readdir(dirPath, { withFileTypes: true });
    const fileList = files.map(file => ({
      name: file.name,
      isDirectory: file.isDirectory(),
      isFile: file.isFile()
    }));
    
    return {
      dirPath,
      files: fileList,
      count: fileList.length,
      timestamp: Date.now()
    };
  }

  async handleFileDelete(data) {
    this.checkPermission('allowFileOperations');
    
    const { filePath } = data;
    if (!filePath) throw new Error('缺少参数: filePath');
    
    await fs.unlink(filePath);
    return {
      success: true,
      filePath,
      timestamp: Date.now()
    };
  }

  // 命令执行方法
  async handleCommandExecute(data) {
    this.checkPermission('allowCommandExecution');
    
    const { command, cwd } = data;
    if (!command) throw new Error('缺少参数: command');
    
    const options = {};
    if (cwd) options.cwd = cwd;
    
    const { stdout, stderr } = await execAsync(command, options);
    
    return {
      command,
      stdout,
      stderr,
      timestamp: Date.now()
    };
  }

  // 测试方法
  async handleTestEvent(data) {
    const { eventType, eventData } = data;
    
    // 模拟事件
    Bot.emit(eventType, eventData);
    
    return {
      success: true,
      eventType,
      eventData,
      timestamp: Date.now()
    };
  }

  async handleTestMessage(data) {
    const { message, user_id, sender } = data;
    
    // 使用提供的 user_id，如果没有则使用 'mcp_test_user'
    let userId = user_id || sender || 'mcp_test_user';
    
    // 确保 userId 是字符串且不为空
    if (!userId || userId === 'undefined') {
      userId = 'mcp_test_user';
    }
    
    // 检查Bot对象
    
    // 确保Bot对象存在
    if (!Bot || typeof Bot !== 'object') {
      throw new Error(`Bot对象不可用或未正确初始化。Bot类型: ${typeof Bot}`);
    }

    // 获取第一个可用的Bot实例
    const botIds = Bot.uin || [];
    if (botIds.length === 0) {
      throw new Error('没有可用的Bot实例');
    }
    const self_id = botIds[0];
    
    const bot = Bot[self_id];
    if (!bot) {
      throw new Error(`找不到Bot实例: ${self_id}`);
    }
    if (typeof bot === 'string') {
      throw new Error(`Bot实例是字符串而不是对象: ${bot}`);
    }
    
    // 创建测试消息事件，完全模拟OneBotv11适配器的消息结构
    const testEvent = {
      post_type: 'message',
      message_type: 'private',
      sub_type: 'friend',
      message_id: Date.now(),
      user_id: userId,
      self_id: self_id,
      message: [{ type: 'text', text: message }],
      raw_message: message,
      font: 0,
      sender: {
        user_id: userId,
        nickname: 'MCP测试用户',
        sex: 'unknown',
        age: 0
      },
      time: Math.floor(Date.now() / 1000),
      bot: bot,
      raw: `{"post_type":"message","message_type":"private","sub_type":"friend","message_id":${Date.now()},"user_id":"${userId}","message":[{"type":"text","text":"${message}"}],"raw_message":"${message}","font":0,"sender":{"user_id":"${userId}","nickname":"MCP测试用户","sex":"unknown","age":0},"time":${Math.floor(Date.now() / 1000)},"self_id":"${self_id}"}`
    };
    
    // 添加适配器方法 - 模拟OneBotv11适配器的pickFriend方法
    const mockAdapter = {
      sendFriendMsg: (data, msg) => {
        // 参考stdin.js优化图片显示，展示路径和URL
        const formatMessage = (item) => {
          if (typeof item === 'string') {
            return item;
          }
          if (typeof item === 'object' && item !== null) {
            if (item.type === 'image') {
               let imageInfo = `[图片]`;
               if (item.file) {
                 // 如果有文件路径，显示路径信息
                 const fileStr = String(item.file);
                 // 检查是否是二进制数据（Buffer）
                 if (Buffer.isBuffer(item.file)) {
                   imageInfo = `发送图片: [二进制数据 ${item.file.length} 字节]`;
                 } else if (fileStr.startsWith('http')) {
                   imageInfo = `发送图片: 网址: ${logger.green(fileStr)}`;
                 } else {
                   imageInfo = `发送图片: 路径: ${logger.cyan(fileStr)}`;
                 }
               }
               return imageInfo;
            } else if (item.type === 'text') {
              return item.text || '[文本消息]';
            } else if (item.type) {
              return `[${item.type}消息]`;
            } else {
              // 对于没有type的对象，检查是否包含二进制数据
              const safeObj = {};
              for (const [key, value] of Object.entries(item)) {
                if (Buffer.isBuffer(value)) {
                  safeObj[key] = `[Buffer ${value.length} 字节]`;
                } else if (typeof value === 'object' && value !== null) {
                  safeObj[key] = '[Object]';
                } else {
                  safeObj[key] = value;
                }
              }
              return JSON.stringify(safeObj);
            }
          }
          return String(item);
        };
        
        const logMsg = Array.isArray(msg) ? 
          msg.map(formatMessage).join('\n') :
          (typeof msg === 'object' && msg !== null) ? formatMessage(msg) : msg;
        logger.info(`[MCP Mock] 发送好友消息: ${typeof logMsg === 'string' ? logMsg : JSON.stringify(logMsg)}`);
        
        // 避免直接输出可能包含二进制数据的原始消息
        if (Array.isArray(msg)) {
          for (const item of msg) {
            if (typeof item === 'object' && item !== null && Buffer.isBuffer(item.file)) {
              // 如果消息包含二进制图片数据，不要直接输出
              return Promise.resolve({ message_id: Date.now() });
            }
          }
        }
        return Promise.resolve({ message_id: Date.now() });
      },
      getMsg: (data, message_id) => {
        return Promise.resolve({ message_id, message: testEvent.message, raw_message: testEvent.raw_message });
      },
      recallMsg: (data, message_id) => {
        logger.info(`[MCP Mock] 撤回消息: ${message_id}`);
        return Promise.resolve({ message_id });
      },
      getFriendInfo: (data) => {
        return Promise.resolve({ user_id: data.user_id, nickname: 'MCP测试用户' });
      }
    };
    
    // 构造friend对象，模拟OneBotv11适配器的pickFriend返回值
    const friendData = {
      user_id: userId,
      nickname: 'MCP测试用户',
      bot: bot,
      self_id: self_id
    };
    
    testEvent.friend = {
      ...friendData,
      sendMsg: mockAdapter.sendFriendMsg.bind(mockAdapter, friendData),
      getMsg: mockAdapter.getMsg.bind(mockAdapter, friendData),
      recallMsg: mockAdapter.recallMsg.bind(mockAdapter, friendData),
      getInfo: mockAdapter.getFriendInfo.bind(mockAdapter, friendData),
      getAvatarUrl() { return `https://q.qlogo.cn/g?b=qq&s=0&nk=${userId}` }
    };
    
    // 添加reply方法
    testEvent.reply = async (msg) => {
      // 参考stdin.js优化图片显示，展示路径和URL
      const formatMessage = (item) => {
          if (typeof item === 'string') {
            return item;
          }
          if (typeof item === 'object' && item !== null) {
            if (item.type === 'image') {
               let imageInfo = `[图片]`;
               if (item.file) {
                 // 如果有文件路径，显示路径信息
                 const fileStr = String(item.file);
                 // 检查是否是二进制数据（Buffer）
                 if (Buffer.isBuffer(item.file)) {
                   imageInfo = `发送图片: [二进制数据 ${item.file.length} 字节]`;
                 } else if (fileStr.startsWith('http')) {
                   imageInfo = `发送图片: 网址: ${logger.green(fileStr)}`;
                 } else {
                   imageInfo = `发送图片: 路径: ${logger.cyan(fileStr)}`;
                 }
               }
               return imageInfo;
            } else if (item.type === 'text') {
              return item.text || '[文本消息]';
            } else if (item.type) {
              return `[${item.type}消息]`;
            } else {
              // 对于没有type的对象，检查是否包含二进制数据
              const safeObj = {};
              for (const [key, value] of Object.entries(item)) {
                if (Buffer.isBuffer(value)) {
                  safeObj[key] = `[Buffer ${value.length} 字节]`;
                } else if (typeof value === 'object' && value !== null) {
                  safeObj[key] = '[Object]';
                } else {
                  safeObj[key] = value;
                }
              }
              return JSON.stringify(safeObj);
            }
          }
          return String(item);
        };
      
      const logMsg = Array.isArray(msg) ? 
        msg.map(formatMessage).join('\n') :
        (typeof msg === 'object' && msg !== null) ? formatMessage(msg) : msg;
      logger.info(`[MCP Test Reply] ${typeof logMsg === 'string' ? logMsg : JSON.stringify(logMsg)}`);
      
      // 避免直接输出可能包含二进制数据的原始消息
      if (Array.isArray(msg)) {
        for (const item of msg) {
          if (typeof item === 'object' && item !== null && Buffer.isBuffer(item.file)) {
            // 如果消息包含二进制图片数据，不要直接输出到控制台
            break;
          }
        }
      }
      return testEvent.friend.sendMsg(msg);
    };
    
    // 确保bot对象有必要的属性
    if (!bot.fl) bot.fl = new Map();
    if (!bot.gl) bot.gl = new Map();
    if (!bot.gml) bot.gml = new Map();
    
    // 添加测试用户到好友列表
    bot.fl.set(userId, {
      user_id: userId,
      nickname: 'MCP测试用户'
    });
    
    try {
      // 记录日志，模拟OneBotv11适配器的makeMessage方法
      Bot.makeLog("info", `好友消息：[MCP测试用户] ${message}`, `${self_id} <= ${userId}`, true);
      
      // 异步触发消息事件，避免阻塞MCP响应
      setImmediate(() => {
        try {
          Bot.em('message.private.friend', testEvent);
        } catch (error) {
          logger.error(`[MCP Handler] 异步消息处理失败: ${error.message}`);
        }
      });
      
      return {
        success: true,
        action: 'test.message',
        testEvent: {
          message_type: testEvent.message_type,
          user_id: testEvent.user_id,
          message: testEvent.raw_message,
          timestamp: testEvent.time,
          self_id: testEvent.self_id
        }
      };
    } catch (error) {
      logger.error(`[MCP Handler] 测试消息处理失败: ${error.message}`);
      return {
        success: false,
        error: error.message,
        timestamp: Date.now()
      };
    }
  }

  // 调试方法
  async handleDebugLogs(data) {
    const { lines = 100 } = data;
    
    // 读取日志文件（需要根据实际日志文件路径调整）
    try {
      const logPath = './logs/error.log';
      const content = await fs.readFile(logPath, 'utf8');
      const logLines = content.split('\n').slice(-lines);
      
      return {
        logs: logLines,
        count: logLines.length,
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        logs: [],
        error: error.message,
        timestamp: Date.now()
      };
    }
  }

  async handleDebugMemory() {
    const memoryUsage = process.memoryUsage();
    
    return {
      memory: {
        rss: memoryUsage.rss,
        heapTotal: memoryUsage.heapTotal,
        heapUsed: memoryUsage.heapUsed,
        external: memoryUsage.external,
        arrayBuffers: memoryUsage.arrayBuffers
      },
      formatted: {
        rss: `${Math.round(memoryUsage.rss / 1024 / 1024 * 100) / 100} MB`,
        heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024 * 100) / 100} MB`,
        heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024 * 100) / 100} MB`
      },
      timestamp: Date.now()
    };
  }

  async handleDebugPerformance() {
    return {
      uptime: process.uptime(),
      cpuUsage: process.cpuUsage(),
      platform: process.platform,
      version: process.version,
      timestamp: Date.now()
    };
  }

  // 权限检查
  checkPermission(permission) {
    const allowed = this.config.mcp?.permissions?.[permission];
    if (!allowed) {
      throw new Error(`权限被拒绝: ${permission}`);
    }
  }

  // 系统监控方法
  async handleSystemInfo() {
    const os = await import('node:os');
    
    return {
      hostname: os.hostname(),
      platform: os.platform(),
      arch: os.arch(),
      release: os.release(),
      type: os.type(),
      cpus: os.cpus().length,
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
      uptime: os.uptime(),
      loadavg: os.loadavg(),
      networkInterfaces: Object.keys(os.networkInterfaces()),
      timestamp: Date.now()
    };
  }

  async handleSystemStats() {
    const os = await import('node:os');
    const memoryUsage = process.memoryUsage();
    
    return {
      cpu: {
        usage: process.cpuUsage(),
        count: os.cpus().length,
        loadavg: os.loadavg()
      },
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem(),
        process: memoryUsage
      },
      system: {
        uptime: os.uptime(),
        platform: os.platform(),
        arch: os.arch()
      },
      timestamp: Date.now()
    };
  }

  async handleSystemProcesses() {
    try {
      const { stdout } = await execAsync('tasklist /fo csv', { encoding: 'utf8' });
      const lines = stdout.split('\n').slice(1).filter(line => line.trim());
      const processes = lines.map(line => {
        const parts = line.split(',').map(part => part.replace(/"/g, ''));
        return {
          name: parts[0],
          pid: parts[1],
          sessionName: parts[2],
          sessionNumber: parts[3],
          memUsage: parts[4]
        };
      });
      
      return {
        processes: processes.slice(0, 50), // 限制返回前50个进程
        count: processes.length,
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        error: error.message,
        processes: [],
        timestamp: Date.now()
      };
    }
  }

  // 网络相关方法
  async handleNetworkPing(data) {
    const { host = 'baidu.com', count = 4 } = data;
    
    try {
      const { stdout } = await execAsync(`ping -n ${count} ${host}`);
      return {
        host,
        result: stdout,
        success: true,
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        host,
        error: error.message,
        success: false,
        timestamp: Date.now()
      };
    }
  }

  async handleNetworkRequest(data) {
    this.checkPermission('allowNetworkAccess');
    
    const { url, method = 'GET', headers = {}, body } = data;
    if (!url) throw new Error('缺少参数: url');
    
    try {
      const fetch = (await import('node-fetch')).default;
      const options = { method, headers };
      if (body && method !== 'GET') {
        options.body = typeof body === 'string' ? body : JSON.stringify(body);
      }
      
      const response = await fetch(url, options);
      const responseData = await response.text();
      
      return {
        url,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers),
        data: responseData,
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        url,
        error: error.message,
        timestamp: Date.now()
      };
    }
  }

  async handleNetworkDownload(data) {
    this.checkPermission('allowFileOperations');
    this.checkPermission('allowNetworkAccess');
    
    const { url, savePath } = data;
    if (!url || !savePath) throw new Error('缺少参数: url 和 savePath');
    
    try {
      const fetch = (await import('node-fetch')).default;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const buffer = await response.buffer();
      await fs.writeFile(savePath, buffer);
      
      return {
        url,
        savePath,
        size: buffer.length,
        success: true,
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        url,
        savePath,
        error: error.message,
        success: false,
        timestamp: Date.now()
      };
    }
  }

  // 数据库相关方法
  async handleDatabaseQuery(data) {
    this.checkPermission('allowRedis');
    
    const { query, type = 'redis' } = data;
    if (!query) throw new Error('缺少参数: query');
    
    try {
      if (type === 'redis') {
        // Redis查询
        const result = await redis.eval(query, 0);
        return {
          query,
          result,
          type,
          timestamp: Date.now()
        };
      }
      
      throw new Error(`不支持的数据库类型: ${type}`);
    } catch (error) {
      return {
        query,
        error: error.message,
        type,
        timestamp: Date.now()
      };
    }
  }

  async handleDatabaseBackup(data) {
    this.checkPermission('allowRedis');
    this.checkPermission('allowFileOperations');
    
    const { backupPath = `./backup_${Date.now()}.rdb` } = data;
    
    try {
      await redis.bgsave();
      return {
        backupPath,
        success: true,
        message: '备份已启动',
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        backupPath,
        error: error.message,
        success: false,
        timestamp: Date.now()
      };
    }
  }

  async handleDatabaseRestore(data) {
    this.checkPermission('allowRedis');
    this.checkPermission('allowFileOperations');
    
    const { backupPath } = data;
    if (!backupPath) throw new Error('缺少参数: backupPath');
    
    // 这里需要根据实际的Redis配置来实现恢复逻辑
    return {
      backupPath,
      message: '数据库恢复功能需要手动配置',
      timestamp: Date.now()
    };
  }

  // 任务调度相关方法
  async handleSchedulerAdd(data) {
    this.checkPermission('allowScheduler');
    
    const { name, cron, action, actionData } = data;
    if (!name || !cron || !action) {
      throw new Error('缺少参数: name, cron, action');
    }
    
    // 这里需要集成实际的任务调度器
    if (!global.scheduledTasks) {
      global.scheduledTasks = new Map();
    }
    
    global.scheduledTasks.set(name, {
      cron,
      action,
      actionData,
      createdAt: Date.now()
    });
    
    return {
      name,
      cron,
      action,
      success: true,
      timestamp: Date.now()
    };
  }

  async handleSchedulerRemove(data) {
    this.checkPermission('allowScheduler');
    
    const { name } = data;
    if (!name) throw new Error('缺少参数: name');
    
    if (!global.scheduledTasks) {
      global.scheduledTasks = new Map();
    }
    
    const removed = global.scheduledTasks.delete(name);
    
    return {
      name,
      removed,
      timestamp: Date.now()
    };
  }

  async handleSchedulerList() {
    this.checkPermission('allowScheduler');
    
    if (!global.scheduledTasks) {
      global.scheduledTasks = new Map();
    }
    
    const tasks = Array.from(global.scheduledTasks.entries()).map(([name, task]) => ({
      name,
      ...task
    }));
    
    return {
      tasks,
      count: tasks.length,
      timestamp: Date.now()
    };
  }

  // 用户管理相关方法
  async handleUserInfo(data) {
    this.checkPermission('allowUserManagement');
    
    const { userId } = data;
    if (!userId) throw new Error('缺少参数: userId');
    
    try {
      const friend = Bot.pickFriend(userId);
      const info = await friend.getSimpleInfo();
      
      return {
        userId,
        info,
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        userId,
        error: error.message,
        timestamp: Date.now()
      };
    }
  }

  async handleUserList(data) {
    this.checkPermission('allowUserManagement');
    
    const { limit = 50 } = data;
    
    try {
      const friends = Array.from(Bot.fl.values()).slice(0, limit).map(friend => ({
        user_id: friend.user_id,
        nickname: friend.nickname,
        remark: friend.remark
      }));
      
      return {
        friends,
        count: friends.length,
        total: Bot.fl.size,
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        error: error.message,
        friends: [],
        timestamp: Date.now()
      };
    }
  }

  async handleUserBan(data) {
    this.checkPermission('allowUserManagement');
    
    const { userId, reason = '违规行为' } = data;
    if (!userId) throw new Error('缺少参数: userId');
    
    // 这里需要实现实际的封禁逻辑
    if (!global.bannedUsers) {
      global.bannedUsers = new Set();
    }
    
    global.bannedUsers.add(userId);
    
    return {
      userId,
      reason,
      banned: true,
      timestamp: Date.now()
    };
  }

  async handleUserUnban(data) {
    this.checkPermission('allowUserManagement');
    
    const { userId } = data;
    if (!userId) throw new Error('缺少参数: userId');
    
    if (!global.bannedUsers) {
      global.bannedUsers = new Set();
    }
    
    const removed = global.bannedUsers.delete(userId);
    
    return {
      userId,
      unbanned: removed,
      timestamp: Date.now()
    };
  }

  // 群组管理相关方法
  async handleGroupInfo(data) {
    this.checkPermission('allowGroupManagement');
    
    const { groupId } = data;
    if (!groupId) throw new Error('缺少参数: groupId');
    
    try {
      const group = Bot.pickGroup(groupId);
      const info = await group.getInfo();
      
      return {
        groupId,
        info,
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        groupId,
        error: error.message,
        timestamp: Date.now()
      };
    }
  }

  async handleGroupList() {
    this.checkPermission('allowGroupManagement');
    
    try {
      const groups = Array.from(Bot.gl.values()).map(group => ({
        group_id: group.group_id,
        group_name: group.group_name,
        member_count: group.member_count
      }));
      
      return {
        groups,
        count: groups.length,
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        error: error.message,
        groups: [],
        timestamp: Date.now()
      };
    }
  }

  async handleGroupMembers(data) {
    this.checkPermission('allowGroupManagement');
    
    const { groupId, limit = 50 } = data;
    if (!groupId) throw new Error('缺少参数: groupId');
    
    try {
      const group = Bot.pickGroup(groupId);
      const members = Array.from(group.members.values()).slice(0, limit).map(member => ({
        user_id: member.user_id,
        nickname: member.nickname,
        card: member.card,
        role: member.role
      }));
      
      return {
        groupId,
        members,
        count: members.length,
        total: group.members.size,
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        groupId,
        error: error.message,
        members: [],
        timestamp: Date.now()
      };
    }
  }

  async handleGroupKick(data) {
    this.checkPermission('allowGroupManagement');
    
    const { groupId, userId, reason = '违规行为' } = data;
    if (!groupId || !userId) throw new Error('缺少参数: groupId 和 userId');
    
    try {
      const group = Bot.pickGroup(groupId);
      await group.kickMember(userId);
      
      return {
        groupId,
        userId,
        reason,
        success: true,
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        groupId,
        userId,
        error: error.message,
        success: false,
        timestamp: Date.now()
      };
    }
  }

  async handleGroupMute(data) {
    this.checkPermission('allowGroupManagement');
    
    const { groupId, userId, duration = 600 } = data;
    if (!groupId || !userId) throw new Error('缺少参数: groupId 和 userId');
    
    try {
      const group = Bot.pickGroup(groupId);
      await group.muteMember(userId, duration);
      
      return {
        groupId,
        userId,
        duration,
        success: true,
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        groupId,
        userId,
        error: error.message,
        success: false,
        timestamp: Date.now()
      };
    }
  }

  async handleGroupUnmute(data) {
    this.checkPermission('allowGroupManagement');
    
    const { groupId, userId } = data;
    if (!groupId || !userId) throw new Error('缺少参数: groupId 和 userId');
    
    try {
      const group = Bot.pickGroup(groupId);
      await group.muteMember(userId, 0);
      
      return {
        groupId,
        userId,
        success: true,
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        groupId,
        userId,
        error: error.message,
        success: false,
        timestamp: Date.now()
      };
    }
  }

  // AI相关方法
  async handleAIChat(data) {
    this.checkPermission('allowAI');
    
    const { message, model = 'gpt-3.5-turbo' } = data;
    if (!message) throw new Error('缺少参数: message');
    
    // 这里需要集成实际的AI服务
    return {
      message,
      response: '这是一个模拟的AI回复，需要配置实际的AI服务',
      model,
      timestamp: Date.now()
    };
  }

  async handleAIImage(data) {
    this.checkPermission('allowAI');
    
    const { prompt, size = '512x512' } = data;
    if (!prompt) throw new Error('缺少参数: prompt');
    
    // 这里需要集成实际的AI图像生成服务
    return {
      prompt,
      imageUrl: 'https://example.com/generated-image.jpg',
      size,
      message: '这是一个模拟的AI图像生成，需要配置实际的AI服务',
      timestamp: Date.now()
    };
  }

  async handleAITranslate(data) {
    this.checkPermission('allowAI');
    
    const { text, from = 'auto', to = 'zh' } = data;
    if (!text) throw new Error('缺少参数: text');
    
    // 这里需要集成实际的翻译服务
    return {
      text,
      translatedText: '这是一个模拟的翻译结果，需要配置实际的翻译服务',
      from,
      to,
      timestamp: Date.now()
    };
  }

  // 媒体处理相关方法
  async handleMediaConvert(data) {
    this.checkPermission('allowMediaProcessing');
    
    const { inputPath, outputPath, format } = data;
    if (!inputPath || !outputPath || !format) {
      throw new Error('缺少参数: inputPath, outputPath, format');
    }
    
    // 这里需要集成实际的媒体转换工具（如FFmpeg）
    return {
      inputPath,
      outputPath,
      format,
      message: '媒体转换功能需要配置FFmpeg',
      timestamp: Date.now()
    };
  }

  async handleMediaCompress(data) {
    this.checkPermission('allowMediaProcessing');
    
    const { inputPath, outputPath, quality = 80 } = data;
    if (!inputPath || !outputPath) {
      throw new Error('缺少参数: inputPath, outputPath');
    }
    
    // 这里需要集成实际的媒体压缩工具
    return {
      inputPath,
      outputPath,
      quality,
      message: '媒体压缩功能需要配置相应工具',
      timestamp: Date.now()
    };
  }

  async handleMediaInfo(data) {
    this.checkPermission('allowMediaProcessing');
    
    const { filePath } = data;
    if (!filePath) throw new Error('缺少参数: filePath');
    
    try {
      const stats = await fs.stat(filePath);
      return {
        filePath,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        isFile: stats.isFile(),
        isDirectory: stats.isDirectory(),
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        filePath,
        error: error.message,
        timestamp: Date.now()
      };
    }
  }

  // 广播事件给MCP客户端
  broadcastEvent(eventType, eventData) {
    // 这里需要访问MCPServer实例来广播
    // 可以通过事件系统或者直接引用来实现
    if (global.mcpServer) {
      global.mcpServer.broadcast({
        type: 'event',
        eventType,
        data: eventData,
        timestamp: Date.now()
      });
    }
  }
}