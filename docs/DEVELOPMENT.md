开发与构建（仅 index.js 与 apps 为 JS，其余 TS）

目标

- 严格约定：除 `index.js` 与 `apps/*.js` 外，所有功能模块均以 TypeScript 开发并编译后运行。
- TS 源码编译到 `dist/`，运行期仅加载 `dist/` 产物，不再加载 `lib/` / `model/` JS。

目录约定

- 源码（TS）：`src/`
  - `MCPServer.ts`、`MCPHandler.ts`、`model/*.ts`、`agent/Simulator.ts`、`mcp-server.ts`
- 编译产物（JS）：`dist/`
  - `MCPServer.js`、`MCPHandler.js`、`model/*.js`、`agent/Simulator.js`、`mcp-server.js`
- 运行期入口仍为 `index.js` 与 `apps/*.js`，但其内部仅引用 `dist/` 产物（例如：`./dist/MCPServer.js`）。

构建命令

- 安装依赖（首次）：
  - 仅在插件目录执行一次：`pnpm i` 或 `npm i`
- 构建：
  - `npm run build`
- 热编译：
 - `npm run watch`

最低环境与约束

- Node.js >= 18（建议 20），ESM 模式。
- 必须先执行构建，运行期只会加载 `dist/` 产物，不再提供 JS 降级路径。
- Windows/WSL 均可；如使用 WSL，请保证时钟与权限一致、工作目录位于挂载盘性能可接受的位置。

运行期如何使用 TS 编译结果

- `MCPHandler` 强制依赖 `dist/agent/Simulator.js`，不再做缺省降级。
  - 注册以下 MCP 动作：
  - `simulate.message`（根据是否传入 `group_id` 自动选择私聊/群聊）
  - `simulate.private`
  - `simulate.group`
- 未构建时插件将无法提供相关动作，因此在开发迭代中请保持 `npm run watch` 持续编译。

新增动作：模拟任意用户消息

- HTTP/WS：`/MCP/api/simulate.message`
- 入参（JSON）：
  - `message`: string | array 消息内容（数组时按 Yunzai segment 结构传）
  - `user_id`: string | number 发送者 UID
  - `group_id?`: string | number 群号（存在则视为群消息）
  - `nickname?`: string 昵称（默认 MCP 模拟用户）
  - `role?`: 'member' | 'admin' | 'owner'（群消息时可选）
  - `bot_id?`: string | number 指定用于收取消息的 Bot（可选）
  - `time?`: number unix 秒（可选）

注意事项

- 本插件使用 ES Module。TypeScript 编译选项采用 `module: NodeNext`，与 Node ESM 一致。
- `apps/` 目录保持 JS，装载逻辑不变；其它模块一律 TS 并从 `dist/` 加载。
- 迁移准则：新功能与重构先落 TS（src），通过 `npm run build` 产出后由 JS 入口引用。

故障排查

- “找不到 dist 模块”：未执行 `npm run build`，或构建失败。
- “权限不足”或 401：检查 `config.yaml` 中 `mcp.security.apiKey` 与请求头 `X-API-Key` 是否一致。
- “端点无响应”：确认 Yunzai 已启动、`mcp.server.enabled: true`，并查看 `/MCP/health`。

IDE/LLM 客户端配置

- 请参考 `docs/MCP-CLIENT.md`，根据你的操作系统将 IDE 的 MCP 配置指向 `dist/mcp-server.js`，并设置所需环境变量。
