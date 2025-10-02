// @ts-nocheck
/* eslint-disable @typescript-eslint/no-explicit-any */
export class AgentSimulator {
    constructor(handler, config) {
        this.handler = handler;
        this.config = config || {};
    }
    async simulateMessage(data) {
        if (data.group_id) {
            return this.simulateGroupMessage(data);
        }
        return this.simulatePrivateMessage(data);
    }
    async simulatePrivateMessage(data) {
        const { msgArray, rawMessage } = this.normalizeMessage(data.message);
        const { bot, self_id } = this.pickBot(data.bot_id);
        const userId = String(data.user_id);
        const nickname = data.nickname || 'MCP模拟用户';
        const message_id = Date.now();
        const time = data.time || Math.floor(Date.now() / 1000);
        const event = {
            post_type: 'message',
            message_type: 'private',
            sub_type: 'friend',
            message_id,
            user_id: userId,
            self_id,
            message: msgArray,
            raw_message: rawMessage,
            font: 0,
            sender: {
                user_id: userId,
                nickname,
                sex: 'unknown',
                age: 0
            },
            time,
            bot,
            raw: JSON.stringify({
                post_type: 'message',
                message_type: 'private',
                sub_type: 'friend',
                message_id,
                user_id: userId,
                message: msgArray,
                raw_message: rawMessage,
                font: 0,
                sender: { user_id: userId, nickname },
                time,
                self_id
            })
        };
        // friend API surface
        event.friend = {
            user_id: userId,
            nickname,
            bot,
            self_id,
            sendMsg: async (msg) => {
                logger.info(`[MCP Sim Reply][private] ${this.stringifyForLog(msg)}`);
                return { message_id: Date.now() };
            },
            getMsg: async (_, message_id) => ({ message_id, message: event.message, raw_message: event.raw_message }),
            recallMsg: async (_, message_id) => ({ message_id }),
            getInfo: async () => ({ user_id: userId, nickname })
        };
        // reply shortcut that also records response
        event.reply = async (msg) => {
            const key = `${userId}_${message_id}`;
            if (this.handler?.messageResponseBuffer?.has(key)) {
                this.handler.messageResponseBuffer.get(key).responses.push({
                    type: 'reply',
                    content: msg,
                    timestamp: Date.now()
                });
            }
            return event.friend.sendMsg(msg);
        };
        // ensure lists exist on bot
        if (bot && typeof bot === 'object') {
            if (!bot.fl)
                bot.fl = new Map();
            if (!bot.gl)
                bot.gl = new Map();
            if (!bot.gml)
                bot.gml = new Map();
            bot.fl.set(userId, { user_id: userId, nickname });
        }
        // log and emit
        try {
            Bot.makeLog('info', `好友消息：[${nickname}] ${rawMessage}`, `${self_id} <= ${userId}`, true);
            setImmediate(() => {
                try {
                    Bot.em('message.private.friend', event);
                }
                catch (err) {
                    logger.error(`[MCP Simulator] 异步私聊消息处理失败: ${err?.message || err}`);
                }
            });
            return {
                success: true,
                action: 'simulate.message',
                data: { message_type: 'private', user_id: userId, message: rawMessage, timestamp: time, self_id },
                timestamp: Date.now()
            };
        }
        catch (error) {
            logger.error('[MCP Simulator] 发送私聊模拟消息失败:', error);
            return { success: false, error: error?.message || String(error) };
        }
    }
    async simulateGroupMessage(data) {
        if (!data.group_id)
            throw new Error('缺少必要参数: group_id');
        const { msgArray, rawMessage } = this.normalizeMessage(data.message);
        const { bot, self_id } = this.pickBot(data.bot_id);
        const userId = String(data.user_id);
        const groupId = String(data.group_id);
        const nickname = data.nickname || 'MCP模拟成员';
        const role = data.role || 'member';
        const message_id = Date.now();
        const time = data.time || Math.floor(Date.now() / 1000);
        const event = {
            post_type: 'message',
            message_type: 'group',
            sub_type: 'normal',
            message_id,
            group_id: groupId,
            user_id: userId,
            self_id,
            message: msgArray,
            raw_message: rawMessage,
            font: 0,
            sender: {
                user_id: userId,
                nickname,
                card: nickname,
                role
            },
            time,
            bot,
            raw: JSON.stringify({
                post_type: 'message',
                message_type: 'group',
                sub_type: 'normal',
                message_id,
                group_id: groupId,
                user_id: userId,
                message: msgArray,
                raw_message: rawMessage,
                font: 0,
                sender: { user_id: userId, nickname, role },
                time,
                self_id
            })
        };
        // group API surface
        event.group = {
            group_id: groupId,
            name: 'MCP模拟群',
            bot,
            self_id,
            sendMsg: async (msg) => {
                logger.info(`[MCP Sim Reply][group ${groupId}] ${this.stringifyForLog(msg)}`);
                return { message_id: Date.now() };
            },
            getMsg: async (_, message_id) => ({ message_id, message: event.message, raw_message: event.raw_message }),
            recallMsg: async (_, message_id) => ({ message_id })
        };
        // reply shortcut that also records response
        event.reply = async (msg) => {
            const key = `${groupId}_${message_id}`;
            if (this.handler?.messageResponseBuffer?.has(key)) {
                this.handler.messageResponseBuffer.get(key).responses.push({
                    type: 'reply',
                    content: msg,
                    timestamp: Date.now()
                });
            }
            return event.group.sendMsg(msg);
        };
        if (bot && typeof bot === 'object') {
            if (!bot.fl)
                bot.fl = new Map();
            if (!bot.gl)
                bot.gl = new Map();
            if (!bot.gml)
                bot.gml = new Map();
            bot.gl.set(groupId, { group_id: groupId, group_name: 'MCP模拟群' });
            bot.gml.set(groupId, new Map([[userId, { user_id: userId, nickname, role }]]));
        }
        try {
            Bot.makeLog('info', `群消息：[${nickname}] ${rawMessage}`, `${self_id} <= ${groupId} ${userId}`, true);
            setImmediate(() => {
                try {
                    Bot.em('message.group.normal', event);
                }
                catch (err) {
                    logger.error(`[MCP Simulator] 异步群消息处理失败: ${err?.message || err}`);
                }
            });
            return {
                success: true,
                action: 'simulate.message',
                data: { message_type: 'group', group_id: groupId, user_id: userId, message: rawMessage, timestamp: time, self_id },
                timestamp: Date.now()
            };
        }
        catch (error) {
            logger.error('[MCP Simulator] 发送群模拟消息失败:', error);
            return { success: false, error: error?.message || String(error) };
        }
    }
    normalizeMessage(message) {
        if (Array.isArray(message)) {
            return { msgArray: message, rawMessage: this.stringifyForLog(message) };
        }
        return { msgArray: [{ type: 'text', text: String(message) }], rawMessage: String(message) };
    }
    stringifyForLog(msg) {
        if (typeof msg === 'string')
            return msg;
        try {
            return JSON.stringify(msg);
        }
        catch {
            return String(msg);
        }
    }
    pickBot(bot_id) {
        let self_id = 'stdin';
        let bot = Bot?.stdin;
        if (bot_id && Bot?.bots?.[bot_id]) {
            return { bot: Bot.bots[bot_id], self_id: String(bot_id) };
        }
        if (Bot?.uin && Array.isArray(Bot.uin) && Bot.uin.length > 0) {
            self_id = Bot.uin[0];
            bot = Bot[self_id];
        }
        else if (Bot?.bots && Object.keys(Bot.bots).length > 0) {
            const botKeys = Object.keys(Bot.bots);
            self_id = botKeys[0];
            bot = Bot.bots[self_id];
        }
        if (!bot || typeof bot === 'string') {
            throw new Error(`找不到可用的Bot实例: ${self_id}`);
        }
        return { bot, self_id: String(self_id) };
    }
}
//# sourceMappingURL=Simulator.js.map