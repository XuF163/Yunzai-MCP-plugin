MCP 客户端（IDE/LLM）配置

前置条件

- 已在插件目录执行一次构建：`npm run build`（生成 `dist/mcp-server.js`）。
- Yunzai 已运行，且本插件 `mcp.server.enabled: true`。
- API Key 与路径与服务端配置一致（见 `config/config.yaml` 或 `config/defSet.yaml`）。

环境变量支持

- `YUNZAI_API_KEY`：鉴权密钥（默认 `mcp-yunzai-2024`）。
- `YUNZAI_BASE_URL`：Yunzai 主地址（默认 `http://localhost:2536`）。
- `YUNZAI_MCP_PATH`：MCP 路由前缀（默认 `/MCP`）。
- `YUNZAI_MCP_URL`：完整 MCP 基础地址（优先级高于 BASE_URL+PATH），例如 `http://127.0.0.1:2536/MCP`。

Windows 示例（路径请按实际本机调整）

```json
{
  "mcpServers": {
    "yunzai-mcp": {
      "command": "node",
      "args": [
        "C:\\Users\\X\\Desktop\\Bot-Dev\\Yunzai\\plugins\\Yunzai-MCP-plugin\\dist\\mcp-server.js"
      ],
      "env": {
        "YUNZAI_API_KEY": "mcp-yunzai-2024",
        "YUNZAI_BASE_URL": "http://127.0.0.1:2536",
        "YUNZAI_MCP_PATH": "/MCP"
        // 可直接使用完整地址（优先级更高）：
        // "YUNZAI_MCP_URL": "http://127.0.0.1:2536/MCP"
      }
    }
  }
}
```

Linux/macOS 示例

```json
{
  "mcpServers": {
    "yunzai-mcp": {
      "command": "node",
      "args": [
        "/absolute/path/to/Yunzai/plugins/Yunzai-MCP-plugin/dist/mcp-server.js"
      ],
      "env": {
        "YUNZAI_API_KEY": "mcp-yunzai-2024",
        "YUNZAI_MCP_URL": "http://127.0.0.1:2536/MCP"
      }
    }
  }
}
```

验证

- 打开浏览器访问健康检查：`http://127.0.0.1:2536/MCP/health`
- 确认 IDE 左侧工具列表能显示 yun zai mcp 工具（如 `yunzai_bot_status`）。

联调建议（无真实适配器）

- 唯一入站入口：`POST /MCP/api/mock.incoming.message`
- 群聊示例：
  - Body：`{"message":"#帮助","user_id":"test_user_456","group_id":"test_group_123","waitMs":1200}`
  - 返回包含聚合的机器人回复（无需再查询 message.response）
- 私聊示例：
  - Body：`{"message":"#帮助","user_id":"test_user_456","waitMs":1200}`

常见问题

- 401 Unauthorized：`X-API-Key` 与服务端配置不一致，检查 `config/config.yaml` 中的 `mcp.security.apiKey`。
- 404/连接失败：确认 Yunzai 已启动、`mcp.server.enabled: true`，以及 BASE_URL/MCP_PATH 正确。
- Node 不可用：确保系统 PATH 中存在 `node`，或将 `command` 改为 Node 的绝对路径。
