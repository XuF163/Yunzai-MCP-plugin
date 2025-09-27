// @ts-nocheck
/**
 * 消息处理模块
 * 负责消息发送、撤回、历史记录等功能
 */
export class MessageHandler {
    constructor(config) {
        this.config = config;
        this.messageResponseBuffer = new Map(); // 存储消息响应
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
        try {
            // 选择Bot
            let bot;
            if (bot_id) {
                bot = Bot.bots[bot_id];
                if (!bot) {
                    throw new Error(`指定的Bot不存在: ${bot_id}`);
                }
            }
            else {
                // 使用第一个可用的Bot
                const botIds = Object.keys(Bot.bots);
                if (botIds.length === 0) {
                    throw new Error('没有可用的Bot');
                }
                bot = Bot.bots[botIds[0]];
            }
            // 发送消息
            const result = await bot.pickFriend(user_id).sendMsg(message);
            return {
                success: true,
                action: 'send.friend',
                data: {
                    message_id: result.message_id,
                    user_id: user_id,
                    bot_id: bot.uin,
                    message: message,
                    timestamp: Date.now()
                },
                timestamp: Date.now()
            };
        }
        catch (error) {
            logger.error('[MCP Handler] 发送好友消息失败:', error);
            return {
                success: false,
                action: 'send.friend',
                error: error.message,
                timestamp: Date.now()
            };
        }
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
        try {
            // 选择Bot
            let bot;
            if (bot_id) {
                bot = Bot.bots[bot_id];
                if (!bot) {
                    throw new Error(`指定的Bot不存在: ${bot_id}`);
                }
            }
            else {
                // 使用第一个可用的Bot
                const botIds = Object.keys(Bot.bots);
                if (botIds.length === 0) {
                    throw new Error('没有可用的Bot');
                }
                bot = Bot.bots[botIds[0]];
            }
            // 发送消息
            const result = await bot.pickGroup(group_id).sendMsg(message);
            return {
                success: true,
                action: 'send.group',
                data: {
                    message_id: result.message_id,
                    group_id: group_id,
                    bot_id: bot.uin,
                    message: message,
                    timestamp: Date.now()
                },
                timestamp: Date.now()
            };
        }
        catch (error) {
            logger.error('[MCP Handler] 发送群消息失败:', error);
            return {
                success: false,
                action: 'send.group',
                error: error.message,
                timestamp: Date.now()
            };
        }
    }
    /**
     * 撤回消息
     * @param {Object} data 撤回数据
     * @returns {Object} 撤回结果
     */
    async recallMessage(data) {
        this.checkPermission('allowRecallMessage');
        const { message_id, type, user_id, group_id, bot_id } = data;
        if (!message_id) {
            throw new Error('缺少必要参数: message_id');
        }
        try {
            // 选择Bot
            let bot;
            if (bot_id) {
                bot = Bot.bots[bot_id];
                if (!bot) {
                    throw new Error(`指定的Bot不存在: ${bot_id}`);
                }
            }
            else {
                // 使用第一个可用的Bot
                const botIds = Object.keys(Bot.bots);
                if (botIds.length === 0) {
                    throw new Error('没有可用的Bot');
                }
                bot = Bot.bots[botIds[0]];
            }
            let result;
            if (type === 'group' && group_id) {
                // 撤回群消息
                result = await bot.pickGroup(group_id).recallMsg(message_id);
            }
            else if (type === 'private' && user_id) {
                // 撤回私聊消息
                result = await bot.pickFriend(user_id).recallMsg(message_id);
            }
            else {
                throw new Error('无效的消息类型或缺少目标ID');
            }
            return {
                success: true,
                action: 'recall.message',
                data: {
                    message_id: message_id,
                    type: type,
                    user_id: user_id,
                    group_id: group_id,
                    bot_id: bot.uin,
                    timestamp: Date.now()
                },
                timestamp: Date.now()
            };
        }
        catch (error) {
            logger.error('[MCP Handler] 撤回消息失败:', error);
            return {
                success: false,
                action: 'recall.message',
                error: error.message,
                timestamp: Date.now()
            };
        }
    }
    /**
     * 获取消息历史
     * @param {Object} data 查询参数
     * @returns {Object} 历史消息
     */
    async getMessageHistory(data) {
        const { type, user_id, group_id, count = 20, message_seq, bot_id } = data;
        if (!type || (type === 'private' && !user_id) || (type === 'group' && !group_id)) {
            throw new Error('缺少必要参数');
        }
        try {
            // 选择Bot
            let bot;
            if (bot_id) {
                bot = Bot.bots[bot_id];
                if (!bot) {
                    throw new Error(`指定的Bot不存在: ${bot_id}`);
                }
            }
            else {
                // 使用第一个可用的Bot
                const botIds = Object.keys(Bot.bots);
                if (botIds.length === 0) {
                    throw new Error('没有可用的Bot');
                }
                bot = Bot.bots[botIds[0]];
            }
            let result;
            if (type === 'group') {
                // 获取群聊历史
                result = await bot.pickGroup(group_id).getChatHistory(message_seq, count);
            }
            else if (type === 'private') {
                // 获取私聊历史
                result = await bot.pickFriend(user_id).getChatHistory(message_seq, count);
            }
            return {
                success: true,
                action: 'message.history',
                data: {
                    type: type,
                    user_id: user_id,
                    group_id: group_id,
                    count: count,
                    message_seq: message_seq,
                    bot_id: bot.uin,
                    messages: result || [],
                    timestamp: Date.now()
                },
                timestamp: Date.now()
            };
        }
        catch (error) {
            logger.error('[MCP Handler] 获取消息历史失败:', error);
            return {
                success: false,
                action: 'message.history',
                error: error.message,
                timestamp: Date.now()
            };
        }
    }
    /**
     * 获取指定消息
     * @param {Object} data 查询参数
     * @returns {Object} 消息详情
     */
    async getMessage(data) {
        const { message_id, bot_id } = data;
        if (!message_id) {
            throw new Error('缺少必要参数: message_id');
        }
        try {
            // 选择Bot
            let bot;
            if (bot_id) {
                bot = Bot.bots[bot_id];
                if (!bot) {
                    throw new Error(`指定的Bot不存在: ${bot_id}`);
                }
            }
            else {
                // 使用第一个可用的Bot
                const botIds = Object.keys(Bot.bots);
                if (botIds.length === 0) {
                    throw new Error('没有可用的Bot');
                }
                bot = Bot.bots[botIds[0]];
            }
            const result = await bot.getMsg(message_id);
            return {
                success: true,
                action: 'message.get',
                data: {
                    message_id: message_id,
                    bot_id: bot.uin,
                    message: result,
                    timestamp: Date.now()
                },
                timestamp: Date.now()
            };
        }
        catch (error) {
            logger.error('[MCP Handler] 获取消息失败:', error);
            return {
                success: false,
                action: 'message.get',
                error: error.message,
                timestamp: Date.now()
            };
        }
    }
    /**
     * 获取转发消息内容
     * @param {Object} data 查询参数
     * @returns {Object} 转发消息内容
     */
    async getForwardMessage(data) {
        const { message_id, bot_id } = data;
        if (!message_id) {
            throw new Error('缺少必要参数: message_id');
        }
        try {
            // 选择Bot
            let bot;
            if (bot_id) {
                bot = Bot.bots[bot_id];
                if (!bot) {
                    throw new Error(`指定的Bot不存在: ${bot_id}`);
                }
            }
            else {
                // 使用第一个可用的Bot
                const botIds = Object.keys(Bot.bots);
                if (botIds.length === 0) {
                    throw new Error('没有可用的Bot');
                }
                bot = Bot.bots[botIds[0]];
            }
            const result = await bot.getForwardMsg(message_id);
            return {
                success: true,
                action: 'message.forward',
                data: {
                    message_id: message_id,
                    bot_id: bot.uin,
                    forward_content: result,
                    timestamp: Date.now()
                },
                timestamp: Date.now()
            };
        }
        catch (error) {
            logger.error('[MCP Handler] 获取转发消息失败:', error);
            return {
                success: false,
                action: 'message.forward',
                error: error.message,
                timestamp: Date.now()
            };
        }
    }
}
// @ts-nocheck
//# sourceMappingURL=MessageHandler.js.map