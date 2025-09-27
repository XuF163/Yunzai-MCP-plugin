Yunzai-MCP-plugin 目录架构概览

插件根目录：plugins/Yunzai-MCP-plugin

- index.js
  - 插件入口。初始化并挂载 MCP HTTP 路由（复用 Yunzai Express），启动独立的 MCP Server 子进程，动态加载 `apps/` 下的应用。
- dist/
  - TS 编译产物（运行期仅加载 dist 内模块）。
  - 关键文件：`MCPServer.js`、`MCPHandler.js`、`model/*.js`、`mcp-server.js`、`agent/Simulator.js`。
- apps/
  - `mcp-control.js`：聊天命令入口（#mcp、#mcp状态等），用于查看与控制 MCP 服务。
  - `mcp-debug.js`：调试与压力测试命令（#mcp消息、#mcp api、#mcp压测 等）。
- src/
  - TS 源码（不直接运行）：
    - `MCPServer.ts`：将 MCP API 挂载到 Yunzai 的 Express 与 WebSocket。
    - `MCPHandler.ts`：动作分发中心，路由到各 Manager。
    - `model/*.ts`：Bot/Message/Time/Redis/Log/File/System/Network 等模块实现。
    - `agent/Simulator.ts`：Agent 模拟任意用户/群消息能力。
    - `mcp-server.ts`：独立 MCP 进程（供 IDE/LLM 直连）。
- config/
  - `defSet.yaml`：默认配置。
  - `config.yaml`：用户配置（首次运行由 `defSet.yaml` 自动复制生成）。
- docs/
  - 本文档与开发说明文档。
- package.json / package-lock.json
  - 插件元信息与依赖。type=module（ESM）。
- node_modules/
  - 插件私有依赖。

推荐目录树（部分）

```
plugins/Yunzai-MCP-plugin
├─ index.js              # 仅此入口使用 JS
├─ apps/                 # 仅此目录使用 JS
│  ├─ mcp-control.js
│  └─ mcp-debug.js
├─ config/
│  ├─ config.yaml
│  └─ defSet.yaml
├─ docs/
│  ├─ ARCHITECTURE.md
│  ├─ DEVELOPMENT.md
│  └─ API.md
├─ src/                  # 全部 TS 源码（不直接运行）
│  ├─ MCPServer.ts
│  ├─ MCPHandler.ts
│  ├─ mcp-server.ts
│  ├─ agent/Simulator.ts
│  └─ model/*.ts
└─ dist/                 # 运行期加载的编译产物
   ├─ MCPServer.js
   ├─ MCPHandler.js
   ├─ mcp-server.js
   ├─ agent/Simulator.js
   └─ model/*.js
```

运行时关键流转

- Yunzai 加载 `index.js` → 从 `dist/` 加载 `MCPServer.js`（复用 Bot.express）→ 注册 `/MCP` 路由 + WebSocket → 暴露 `global.mcpServer`。
- 对外 API（HTTP/WS）进入 `MCPServer` → 校验/记录 → 转发到 `MCPHandler.handleAction(action, data, ctx)`。
- `MCPHandler`（来自 `dist/`）内部通过 `actionMap` 调用各 Manager 完成具体操作。
- `apps/` 中的命令（如 #mcp、#mcp消息）通过聊天触发，侧面调用 `global.mcpServer` 或 `MCPHandler` 的能力。

事件与响应跟踪

- `MCPHandler` 在构造时订阅 Bot 的 `message/notice/request` 事件，并将原始消息写入 `messageResponseBuffer`，供 `message.response` 查询使用。

重要约束

- 仅 `index.js` 与 `apps/*.js` 使用原生 JS，其余模块必须使用 TS 并经编译后运行。
- 插件首次运行时，如 `config/config.yaml` 不存在，将自动从 `config/defSet.yaml` 复制生成。
- 独立 `mcp-server` 进程由 `index.js` 启动，产物路径为 `dist/mcp-server.js`。
