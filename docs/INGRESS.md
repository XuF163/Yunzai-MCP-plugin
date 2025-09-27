LLM → Bot 入站（Ingress）联调指南

用途

- 在没有真实社交平台适配器的情况下，模拟群聊/私聊消息进入 Yunzai，使机器人像处理真实消息一样执行插件逻辑，用于端到端测试与联调。

设计要点

- 使用本插件提供的唯一入站动作 `mock.incoming.message` 作为“入站消息接口”。
- 接入路径：`POST /MCP/api/mock.incoming.message`（私聊与群聊统一入口，带 `group_id` 则视为群聊）。
- 机器人侧会生成 OneBot v11 风格事件，并通过 `Bot.em('message.private.friend')` 或 `Bot.em('message.group.normal')` 注入 Yunzai 事件流。
- 机器人回复不会对外真实发送，而是通过内部 mock 的 `friend/group.sendMsg` 完成本地回执，同时写入 `messageResponseBuffer`，可用 `message.response` 查询。

消息格式

- 私聊：
  - `message`: string | array（Yunzai/segment 风格）
  - `user_id`: string|number（发送者）
  - `nickname?`: string（默认 MCP 模拟用户）
  - `bot_id?`: string|number（选用 Bot，默认首个可用）
  - `time?`: number（unix 秒，可选）
- 群聊：在私聊基础上附加：
  - `group_id`: string|number（群号）
  - `role?`: 'member'|'admin'|'owner'

调用流程（建议）

1) 由 LLM/IDE 发起入站消息

POST /MCP/api/mock.incoming.message
{
  "message": "#帮助",
  "user_id": "test_user_456",
  "group_id": "test_group_123"
}

2) 轮询/查询机器人回复

POST /MCP/api/message.response
{
  "groupId": "test_group_123",
  "includeOriginal": true
}

返回中 `responses[*].content` 即为机器人实际给出的回复内容（已做循环引用与二进制安全处理）。

关联与时序

- `mock.incoming.message` 会在内部等待少量时间（可通过 `waitMs` 调节），并同步返回聚合到的回复。
- 仍可通过 `traceId` 字段做请求与回复的外部关联。

与 send.* 的区别

- `send.friend`/`send.group`：需要真实连接的适配器对象（存在 `pickFriend/pickGroup`）。
- `mock.incoming.message`：仅进行入站模拟，不需要任何外部适配器连接，适合纯联调或沙箱测试；执行后会等待短时并同步返回聚合回复。
- 若需完整出站流程联调，可使用“Mock 专有适配器”相关动作（详见 API.md 的 mock.*），它会注册内置 Bot（UIN: 999001），提供 `pickFriend/pickGroup` 并记录 outbox。

安全与权限

- 必须在 Header 携带 `X-API-Key`，值与服务端 `config.yaml` 的 `mcp.security.apiKey` 一致（默认 `mcp-yunzai-2024`）。

常见问题

- 拿不到回复：
  - 检查你的业务插件是否匹配消息触发（例如 `#帮助`）。
  - 增加查询等待时间或使用 `since` 过滤：`{"groupId":"...","since":"2025-01-19T11:22:33.000Z"}`
  - 确认 `mcp.server.enabled: true` 且使用正确的 API Key。
- 看到 `pickGroup is not a function`：说明误用了 `send.group`；请改用 `mock.incoming.message`。
