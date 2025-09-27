配置说明（基于 config/defSet.yaml）

文件位置

- 默认：`plugins/Yunzai-MCP-plugin/config/defSet.yaml`
- 用户：`plugins/Yunzai-MCP-plugin/config/config.yaml`
  - 首次运行若无用户配置，`index.js` 会自动复制默认配置生成用户配置。

配置项

- mcp.server
  - `enabled` boolean 是否启用 MCP 服务器
  - `path` string MCP 服务挂载路径（默认 `/MCP`，复用 Yunzai 主端口）
  - `allowedOrigins` array CORS 允许来源（默认 `*`）
  - `apiKey` string API 鉴权密钥（通过请求头 `X-API-Key` 传入）
  - `verbose` boolean 是否输出详细日志

- mcp.permissions
  - `allowRestart` 是否允许重启 Bot（`bot.restart`/`bot.shutdown`）
  - `allowShutdown` 是否允许关闭 Bot
  - `allowRedis` 是否允许 Redis 操作
  - `allowSendMessage` 是否允许发送消息（`send.friend`/`send.group`）
  - `allowReceiveMessage` 是否允许接收消息（通常为内部事件）
  - `allowPluginAccess` 是否允许插件管理相关动作
  - `allowFileOperations` 是否允许文件操作
  - `allowCommandExecution` 是否允许命令执行

- mcp.security
  - `maxRequestSize` number 最大请求体（MB）
  - `rateLimit` number 频率限制（每分钟）
  - `logAllRequests` boolean 是否记录所有请求（用于审计与调试）

- mcp.debug
  - `enabled` 是否启用调试开关
  - `logLevel` 日志级别
  - `saveHistory` 是否保存请求历史
  - `maxHistorySize` 请求历史最大条数

修改建议

- 生产使用请修改 `apiKey` 为强口令，并限制 `allowedOrigins`。
- 如使用大量传输或生成图片等大对象，可适当提高 `maxRequestSize`。
- 若外部高频调用，请结合上游网关与 `rateLimit` 两层限流。

