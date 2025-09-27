MCP 扩展 API 说明

- 基础
  - 健康检查：`GET /MCP/health`
  - 动作调用：`GET|POST /MCP/api/:action`
  - 鉴权：`X-API-Key: <config.mcp.security.apiKey>`（默认 defSet.yaml 为 `mcp-yunzai-2024`）

常用动作（精简暴露）

- Bot：`bot.status` `bot.info`
- 入站唯一入口：`mock.incoming.message`
  - 用于 LLM→Bot 入站消息；带 `group_id` 视为群聊，否则私聊。
  - 参数：
    - `message` string | array 消息内容
    - `user_id` string|number 发送者账号
    - `group_id?` string|number 群号（存在则为群聊）
    - `nickname?` string、`role?` 'member'|'admin'|'owner'
    - `waitMs?` number 等待机器人回复的毫秒数（默认约 1200）
    - `traceId?` string 追踪标识
  - 返回：
    - `data.injected`: { message_id, type, user_id, group_id?, traceId }
    - `data.responses`: 聚合的机器人回复数组（图片自动附带 `url` 和分辨率）
    - `data.count`: 回复条数，`waitMs`: 等待耗时
- Mock 专有适配器（联调用）：
  - `mock.init` `mock.reset` `mock.status`
  - 好友：`mock.friend.add` `mock.friend.remove` `mock.friend.list`
  - 群组：`mock.group.add` `mock.group.remove` `mock.group.list`
  - 成员：`mock.group.member.add` `mock.group.member.remove` `mock.group.members`
  - 出站：`mock.send.friend` `mock.send.group` `mock.history`
- 消息查询：`message.history` `message.get` `message.forward` `recall.message`

请求示例（curl）

1) 健康检查

curl -s http://localhost:2536/MCP/health

2) 获取 Bot 状态

curl -s -H "X-API-Key: mcp-yunzai-2024" \
  http://localhost:2536/MCP/api/bot.status

3) 入站唯一入口（群聊）

curl -s -X POST -H "Content-Type: application/json" -H "X-API-Key: mcp-yunzai-2024" \
  -d '{"message":"#帮助","user_id":"u1","group_id":"g1","waitMs":1200,"traceId":"trace-001"}' \
  http://localhost:2536/MCP/api/mock.incoming.message

4) 获取 Redis 值（如启用）

curl -s -X POST -H "Content-Type: application/json" -H "X-API-Key: mcp-yunzai-2024" \
  -d '{"key":"test_key"}' \
  http://localhost:2536/MCP/api/redis.get

WebSocket 说明

- 连接：`ws://<host>:<port>/MCP/ws`
- 消息格式：发送 `{ action, data, id }`，返回 `{ id, success, data|error }`
- 服务器可通过 `broadcast()` 推送 `{ type: 'broadcast', data, timestamp }`
