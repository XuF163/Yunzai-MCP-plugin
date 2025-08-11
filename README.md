# Yunzai-MCP-Plugin

一个为Yunzai-Bot提供LLM通信能力的插件，支持全权限调试和控制功能。

## 功能特性

- 🚀 **全权限访问**: 计划支持Bot重启、关闭、消息收发等完整控制





### 示例
```
{
  "mcpServers": {
    "yunzai-mcp": {
      "command": "node",
      "args": [
        "C:\\Users\\X\\Desktop\\Bot-Dev\\Yunzai\\plugins\\Yunzai-MCP-plugin\\mcp-server.js"
      ],
      "env": {
        "YUNZAI_API_KEY": "mcp-yunzai-2024",
        "YUNZAI_BASE_URL": "http://127.0.0.1:2536",
        "YUNZAI_MCP_PATH": "/MCP"
      }
    }
  }
}

```
