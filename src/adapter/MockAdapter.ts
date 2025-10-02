// @ts-nocheck

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

declare const Bot: any;
declare const logger: any;

export class MockEnvironment {
  constructor(handler, options = {}) {
    this.handler = handler;
    this.options = options;
    this.uin = options.uin || 999001; // 专用 Mock Bot UIN（数字）
    this.nickname = options.nickname || 'MCP Mock Bot';
    this.adapter = { id: 'mcp-mock', name: 'MCP Mock Adapter' };
    this.outbox = []; // bot 主动发送的消息
    this.inbox = []; // 外部注入的消息（可选记录）
    this.friends = new Map(); // user_id -> { user_id, nickname }
    this.groups = new Map(); // group_id -> { group_id, name }
    this.groupMembers = new Map(); // group_id -> Map(user_id -> { user_id, nickname, role })
    this.initialized = false;
    this.imageDir = path.join(process.cwd(), 'data', 'mcp_client');
    this._fetchFn = null;
  }

  init() {
    if (!global.Bot) throw new Error('Bot 全局未就绪');
    if (!Bot.bots) Bot.bots = {};
    if (Bot.bots[this.uin]) {
      this.initialized = true;
      return this.status();
    }

    const env = this;

    const mockBot = {
      uin: this.uin,
      nickname: this.nickname,
      status: 'online',
      adapter: this.adapter,
      platform: 'mock',
      fl: this.friends, // 好友列表
      gl: this.groups,  // 群列表
      gml: this.groupMembers, // 群成员列表
      pickFriend(user_id) {
        const uid = String(user_id);
        const friend = env.ensureFriend(uid);
        return env.buildFriendApi(friend);
      },
      pickGroup(group_id) {
        const gid = String(group_id);
        const group = env.ensureGroup(gid);
        return env.buildGroupApi(group);
      },
      getMsg(message_id) {
        const m = env.outbox.find(m => m.message_id === message_id) || env.inbox.find(m => m.message_id === message_id);
        return m || null;
      }
    };

    Bot.bots[this.uin] = mockBot;

    // 监听入站消息，记录到 inbox（只记录发给当前 mock bot 的事件）
    if (!this._onMessageListener) {
      this._onMessageListener = (evt) => {
        try {
          const selfId = String(evt.self_id || '');
          if (selfId !== String(this.uin)) return;
          const type = evt.message_type === 'group' ? 'group' : 'private';
          const target = type === 'group' ? String(evt.group_id) : String(evt.user_id);
          const rec = {
            direction: 'in',
            type,
            target,
            message_id: Number(evt.message_id || Date.now()),
            message: evt.message,
            raw_message: evt.raw_message,
            user_id: String(evt.user_id || ''),
            timestamp: evt.time ? evt.time * 1000 : Date.now()
          };
          this.inbox.push(rec);
        } catch (e) {
          logger?.warn?.('[MCP Mock] 记录入站消息失败:', e?.message || e);
        }
      };
      Bot.on?.('message', this._onMessageListener);
    }
    this.initialized = true;
    logger?.mark?.(`[MCP Mock] 已注册专用适配器与Bot实例: ${this.uin}`);
    return this.status();
  }

  reset() {
    this.friends = new Map();
    this.groups = new Map();
    this.groupMembers = new Map();
    this.outbox = [];
    this.inbox = [];
    if (Bot?.bots?.[this.uin]) {
      Bot.bots[this.uin].fl = this.friends;
      Bot.bots[this.uin].gl = this.groups;
      Bot.bots[this.uin].gml = this.groupMembers;
    }
    return this.status();
  }

  status() {
    return {
      initialized: this.initialized,
      uin: this.uin,
      nickname: this.nickname,
      friends: this.friends.size,
      groups: this.groups.size,
      outbox: this.outbox.length,
      inbox: this.inbox.length,
      adapter: this.adapter
    };
  }

  ensureFriend(user_id, nickname = 'Mock Friend') {
    const uid = String(user_id);
    if (!this.friends.has(uid)) this.friends.set(uid, { user_id: uid, nickname });
    return this.friends.get(uid);
  }

  ensureGroup(group_id, name = 'Mock Group') {
    const gid = String(group_id);
    if (!this.groups.has(gid)) this.groups.set(gid, { group_id: gid, name });
    if (!this.groupMembers.has(gid)) this.groupMembers.set(gid, new Map());
    return this.groups.get(gid);
  }

  async ensureMessageImages(msg) {
    const processItem = async (item) => {
      if (!item || typeof item !== 'object') return;
      if (Array.isArray(item)) {
        for (const sub of item) await processItem(sub);
        return;
      }
      if (item.type === 'image') {
        await this.processImageSegment(item);
        return;
      }
      for (const value of Object.values(item)) {
        if (typeof value === 'object' && value) {
          await processItem(value);
        }
      }
    };

    if (Array.isArray(msg)) {
      for (const item of msg) await processItem(item);
    } else if (typeof msg === 'object' && msg !== null) {
      await processItem(msg);
    }
  }

  async processImageSegment(item) {
    if (!item || item.mcpLocalPath) return;

    let buffer = null;
    let fileName = item.name || '';

    const ensureDir = async () => {
      await fs.mkdir(this.imageDir, { recursive: true });
    };

    const finalize = async (buf, preferredName) => {
      if (!buf) return null;
      await ensureDir();
      const { relativePath, finalName } = await this.writeImageBuffer(buf, preferredName);
      item.mcpLocalPath = relativePath;
      if (!item.name) item.name = finalName;
      return buf;
    };

    try {
      if (Buffer.isBuffer(item.file)) {
        buffer = item.file;
        await finalize(buffer, fileName);
      } else if (typeof item.file === 'string') {
        const fileStr = String(item.file);
        if (fileStr.startsWith('base64://')) {
          const base64Data = fileStr.replace('base64://', '');
          buffer = Buffer.from(base64Data, 'base64');
          await finalize(buffer, fileName);
        } else if (fileStr.startsWith('http://') || fileStr.startsWith('https://')) {
          const fetched = await this.fetchImageBuffer(fileStr);
          if (fetched) {
            buffer = fetched;
            let remoteName = '';
            try { remoteName = path.basename(new URL(fileStr).pathname || ''); } catch {}
            await finalize(buffer, fileName || remoteName);
          }
        } else {
          const absPath = path.isAbsolute(fileStr) ? fileStr : path.resolve(process.cwd(), fileStr);
          try {
            buffer = await fs.readFile(absPath);
            await finalize(buffer, fileName || path.basename(absPath));
          } catch {}
        }
      } else if (item.url) {
        const fetched = await this.fetchImageBuffer(item.url);
        if (fetched) {
          buffer = fetched;
          let remoteName = '';
          try { remoteName = path.basename(new URL(item.url).pathname || ''); } catch {}
          await finalize(buffer, fileName || remoteName);
        }
      }

      if (buffer && !item.url) {
        try {
          const urlName = item.name || path.basename(item.mcpLocalPath || '') || `image-${Date.now()}.jpg`;
          item.url = await Bot.fileToUrl(buffer, { name: urlName });
        } catch {}
      }
    } catch (err) {
      logger?.warn?.('[MCP Mock] 图片保存失败:', err?.message || err);
    }
  }

  sanitizeFileName(name) {
    if (!name) return '';
    return String(name).replace(/[^a-zA-Z0-9._-]/g, '_');
  }

  async writeImageBuffer(buffer, preferredName = '') {
    const safeName = this.sanitizeFileName(preferredName);
    let base = safeName || `image-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    if (!path.extname(base)) base += '.jpg';
    const finalName = base;
    const absolutePath = path.join(this.imageDir, finalName);
    const relativePath = path.join('data', 'mcp_client', finalName).split(path.sep).join('/');
    await fs.writeFile(absolutePath, buffer);
    return { finalName, relativePath };
  }

  async fetchImageBuffer(url) {
    try {
      if (!this._fetchFn) {
        this._fetchFn = globalThis.fetch || (await import('node-fetch')).default;
      }
      const res = await this._fetchFn(url);
      if (!res.ok) return null;
      const arrayBuffer = await res.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (err) {
      logger?.warn?.('[MCP Mock] 图片下载失败:', err?.message || err);
      return null;
    }
  }

  addFriend({ user_id, nickname }) {
    const fr = this.ensureFriend(user_id, nickname || 'Mock Friend');
    return { added: true, friend: fr };
  }

  removeFriend({ user_id }) {
    const uid = String(user_id);
    const existed = this.friends.delete(uid);
    return { removed: existed, user_id: uid };
  }

  listFriends() {
    return Array.from(this.friends.values());
  }

  addGroup({ group_id, name }) {
    const gp = this.ensureGroup(group_id, name || 'Mock Group');
    return { added: true, group: gp };
  }

  removeGroup({ group_id }) {
    const gid = String(group_id);
    const existed = this.groups.delete(gid);
    this.groupMembers.delete(gid);
    return { removed: existed, group_id: gid };
  }

  listGroups() {
    return Array.from(this.groups.values());
  }

  addMember({ group_id, user_id, nickname, role = 'member' }) {
    const gid = String(group_id);
    const uid = String(user_id);
    this.ensureGroup(gid);
    const gm = this.groupMembers.get(gid);
    gm.set(uid, { user_id: uid, nickname: nickname || 'Mock Member', role });
    // 确保好友存在，便于后续 pickFriend
    this.ensureFriend(uid, nickname);
    return { added: true, group_id: gid, member: gm.get(uid) };
  }

  removeMember({ group_id, user_id }) {
    const gid = String(group_id);
    const uid = String(user_id);
    const gm = this.groupMembers.get(gid);
    if (!gm) return { removed: false, reason: 'group_not_found' };
    return { removed: gm.delete(uid), group_id: gid, user_id: uid };
  }

  listMembers({ group_id }) {
    const gid = String(group_id);
    const gm = this.groupMembers.get(gid) || new Map();
    return Array.from(gm.values());
  }

  buildFriendApi(friend) {
    const env = this;
    return {
      user_id: friend.user_id,
      nickname: friend.nickname,
      async sendMsg(msg) {
        await env.ensureMessageImages(msg);
        const payload = {
          type: 'private',
          target: friend.user_id,
          message_id: Date.now(),
          message: msg,
          timestamp: Date.now(),
          direction: 'out'
        };
        env.outbox.push(payload);
        // 关联到最近一次该用户的入站会话，写入响应缓冲
        try { env._attachToRecentBuffer('private', friend.user_id, msg); } catch {}
        const logMsg = await env.formatMessageForLog(msg, 'private', friend.user_id);
        logger?.info?.(`[MCP Mock] 发送好友消息 -> ${friend.user_id}: ${logMsg}`);
        return Promise.resolve({ message_id: payload.message_id });
      },
      recallMsg(message_id) {
        const ok = env._markRecalled('private', friend.user_id, message_id);
        logger?.info?.(`[MCP Mock] 撤回好友消息: ${message_id} (${ok ? 'ok' : 'not_found'})`);
        return Promise.resolve({ message_id, success: ok });
      },
      getMsg(message_id) {
        return Promise.resolve(env.findMessage(message_id));
      },
      getChatHistory(message_seq, count = 20) {
        return Promise.resolve(env.chatHistory('private', friend.user_id, count, message_seq));
      }
    };
  }

  buildGroupApi(group) {
    const env = this;
    return {
      group_id: group.group_id,
      name: group.name,
      pickMember(user_id) {
        const gid = String(group.group_id);
        const uid = String(user_id);
        env.ensureGroup(gid);
        const gm = env.groupMembers.get(gid) || new Map();
        const info = gm.get(uid) || { user_id: uid, nickname: 'Mock Member', role: 'member' };
        return {
          user_id: uid,
          group_id: gid,
          getInfo: async () => info,
          getAvatarUrl: () => `https://q.qlogo.cn/g?b=qq&s=0&nk=${uid}`
        };
      },
      async sendMsg(msg) {
        await env.ensureMessageImages(msg);
        const payload = {
          type: 'group',
          target: group.group_id,
          message_id: Date.now(),
          message: msg,
          timestamp: Date.now(),
          direction: 'out'
        };
        env.outbox.push(payload);
        // 关联到最近一次该群的入站会话，写入响应缓冲
        try { env._attachToRecentBuffer('group', group.group_id, msg); } catch {}
        const logMsg = await env.formatMessageForLog(msg, 'group', group.group_id);
        logger?.info?.(`[MCP Mock] 发送群消息 -> ${group.group_id}: ${logMsg}`);
        return Promise.resolve({ message_id: payload.message_id });
      },
      recallMsg(message_id) {
        const ok = env._markRecalled('group', group.group_id, message_id);
        logger?.info?.(`[MCP Mock] 撤回群消息: ${message_id} (${ok ? 'ok' : 'not_found'})`);
        return Promise.resolve({ message_id, success: ok });
      },
      getMsg(message_id) {
        return Promise.resolve(env.findMessage(message_id));
      },
      getChatHistory(message_seq, count = 20) {
        return Promise.resolve(env.chatHistory('group', group.group_id, count, message_seq));
      }
    };
  }

  findMessage(message_id) {
    const mid = Number(message_id);
    return (
      this.outbox.find(m => m.message_id === mid) ||
      this.inbox.find(m => m.message_id === mid) ||
      null
    );
  }

  stringifyForLog(msg) {
    if (typeof msg === 'string') return msg;
    try { return JSON.stringify(msg); } catch { return String(msg); }
  }

  sendFriend({ user_id, message }) {
    const api = this.buildFriendApi(this.ensureFriend(user_id));
    return api.sendMsg(message);
  }

  sendGroup({ group_id, message }) {
    const api = this.buildGroupApi(this.ensureGroup(group_id));
    return api.sendMsg(message);
  }

  history({ type, target, limit = 50 }) {
    const t = type ? String(type) : undefined;
    const tg = target ? String(target) : undefined;
    let list = [...this.outbox, ...this.inbox];
    if (t) list = list.filter(x => x.type === t);
    if (tg) list = list.filter(x => String(x.target) === tg);
    list.sort((a, b) => a.timestamp - b.timestamp);
    const sliced = list.slice(-limit);
    return { count: sliced.length, list: sliced };
  }

  chatHistory(type, target, count = 20, _seq) {
    const t = String(type);
    const tg = String(target);
    let list = [...this.outbox, ...this.inbox]
      .filter(x => x.type === t && String(x.target) === tg)
      .sort((a, b) => a.timestamp - b.timestamp);
    // 可根据 message_seq 做分页，这里简化返回末尾 count 条
    return list.slice(-count);
  }

  _markRecalled(type, target, message_id) {
    const mid = Number(message_id);
    const t = String(type);
    const tg = String(target);
    for (const arr of [this.outbox, this.inbox]) {
      const idx = arr.findIndex(x => x.type === t && String(x.target) === tg && x.message_id === mid);
      if (idx !== -1) {
        arr[idx].recalled = true;
        return true;
      }
    }
    return false;
  }

  _attachToRecentBuffer(type, target, msg) {
    const tg = String(target);
    const buf = this.handler?.messageResponseBuffer;
    if (!buf || typeof buf.forEach !== 'function') return;

    let bestKey = null;
    let bestTs = 0;
    buf.forEach((val, key) => {
      const om = val?.originalMessage || {};
      const match = type === 'group' ? String(om.group_id) === tg : String(om.user_id) === tg;
      if (match && val.timestamp > bestTs) {
        bestTs = val.timestamp;
        bestKey = key;
      }
    });

    if (bestKey && buf.has(bestKey)) {
      buf.get(bestKey).responses.push({ type: 'reply', content: msg, timestamp: Date.now() });
    }
  }

  async formatMessageForLog(msg, type, target) {
    const fmtItem = async (item) => {
      if (typeof item === 'string') return item;
      if (typeof item === 'object' && item) {
        if (item.type === 'image') {
          await this.processImageSegment(item);
          let url = item.url;
          let label = 'Buffer';
          let local = item.mcpLocalPath || '';

          try {
            if (!url) {
              if (Buffer.isBuffer(item.file)) {
                const name = item.name || (item.mcpLocalPath ? path.basename(item.mcpLocalPath) : `image-${Date.now()}.jpg`);
                url = await Bot.fileToUrl(item.file, { name });
              } else if (typeof item.file === 'string') {
                const fileStr = String(item.file);
                if (fileStr.startsWith('http')) {
                  url = fileStr;
                  label = 'URL';
                } else if (fileStr.startsWith('base64://')) {
                  const buf = Buffer.from(fileStr.replace('base64://', ''), 'base64');
                  const name = item.name || (item.mcpLocalPath ? path.basename(item.mcpLocalPath) : `image-${Date.now()}.jpg`);
                  url = await Bot.fileToUrl(buf, { name });
                } else if (fileStr) {
                  local = local || fileStr;
                  label = 'File';
                }
              }
            }
          } catch {}

          if (!local && item.mcpLocalPath) local = item.mcpLocalPath;

          const lines = [
            `发送图片: ${label}`
          ];
          if (local) lines.push(`路径: ${local}`);
          if (url) lines.push(`网址: ${url}`);
          return lines.join('\n');
        }
        // 非图片对象：剔除 Buffer 字段
        const safe = {};
        for (const [k, v] of Object.entries(item)) {
          if (Buffer.isBuffer(v)) safe[k] = `[Buffer ${v.length} bytes]`;
          else if (typeof v === 'object' && v) safe[k] = '[Object]';
          else safe[k] = v;
        }
        return JSON.stringify(safe);
      }
      return String(item);
    };

    if (Array.isArray(msg)) {
      const parts = await Promise.all(msg.map(fmtItem));
      return parts.join('\n');
    }
    return await fmtItem(msg);
  }

  async incomingMessage({ message, user_id, group_id, nickname, role = 'member', waitMs = 1200, traceId }) {
    const bot = Bot?.bots?.[this.uin];
    if (!bot) throw new Error('Mock Bot not initialized');

    const isGroup = !!group_id;
    const msgArray = Array.isArray(message) ? message : [{ type: 'text', text: String(message ?? '') }];
    const rawMessage = Array.isArray(message) ? this.stringifyForLog(message) : String(message ?? '');
    const uid = String(user_id || 'mock_user');
    const gid = group_id ? String(group_id) : undefined;
    const self_id = String(this.uin);
    const now = Date.now();
    const message_id = now;
    const time = Math.floor(now / 1000);

    // Ensure entities
    this.ensureFriend(uid, nickname || 'MCP 模拟用户');
    if (isGroup) {
      this.ensureGroup(gid, 'MCP 模拟群');
      this.addMember({ group_id: gid, user_id: uid, nickname: nickname || 'MCP 模拟成员', role });
    }

    // Build friend/group API
    const friendApi = this.buildFriendApi({ user_id: uid, nickname: nickname || 'MCP 模拟用户' });
    const groupApi = isGroup ? this.buildGroupApi({ group_id: gid, name: 'MCP 模拟群' }) : null;

    const event = {
      post_type: 'message',
      message_type: isGroup ? 'group' : 'private',
      sub_type: isGroup ? 'normal' : 'friend',
      message_id,
      user_id: uid,
      group_id: gid,
      self_id,
      message: msgArray,
      raw_message: rawMessage,
      font: 0,
      sender: {
        user_id: uid,
        nickname: nickname || (isGroup ? 'MCP 模拟成员' : 'MCP 模拟用户'),
        role: isGroup ? role : undefined
      },
      time,
      bot,
      traceId
    };

    // 附上 friend/group API 以契合插件预期
    if (isGroup) event.group = groupApi;
    else event.friend = friendApi;

    // reply: push into messageResponseBuffer via handler
    event.reply = async (msg) => {
      const key = `${isGroup ? gid : uid}_${message_id}`;
      try {
        const buf = this.handler?.messageResponseBuffer;
        if (buf && buf.has(key)) {
          buf.get(key).responses.push({ type: 'reply', content: msg, timestamp: Date.now() });
        }
      } catch {}
      return isGroup ? groupApi.sendMsg(msg) : friendApi.sendMsg(msg);
    };

    // Pre-register for response tracking
    try { this.handler?.recordMessageForResponse?.(event); } catch {}

    // Log and emit
    try {
      if (isGroup) {
        Bot.makeLog?.('info', `群消息：[${event.sender.nickname}] ${rawMessage}`, `${self_id} <= ${gid} ${uid}`, true);
        Bot.em?.('message.group.normal', event);
      } else {
        Bot.makeLog?.('info', `好友消息：[${event.sender.nickname}] ${rawMessage}`, `${self_id} <= ${uid}`, true);
        Bot.em?.('message.private.friend', event);
      }
    } catch (e) {
      logger?.error?.('[MCP Mock] 注入入站消息失败:', e?.message || e);
    }

    // Wait and collect responses
    const since = new Date(now - 10).toISOString();
    const start = Date.now();
    const sleep = (ms) => new Promise(r => setTimeout(r, ms));
    const budget = Math.max(0, Number(waitMs) || 0);
    if (budget > 0) await sleep(budget);

    let responsePack;
    try {
      responsePack = await this.handler?.handleGetMessageResponse?.({
        userId: isGroup ? undefined : uid,
        groupId: isGroup ? gid : undefined,
        since,
        includeOriginal: true
      });
    } catch (e) {
      responsePack = { error: e?.message || String(e) };
    }

    return {
      success: true,
      action: 'mock.incoming.message',
      data: {
        injected: {
          message_id,
          type: event.message_type,
          user_id: uid,
          group_id: gid,
          traceId
        },
        responses: responsePack?.responses || [],
        count: responsePack?.count || 0,
        waitMs: Date.now() - start
      },
      timestamp: Date.now()
    };
  }
}
