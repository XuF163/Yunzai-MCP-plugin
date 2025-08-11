# Yunzai-MCP-Plugin

一个为Yunzai-Bot提供LLM通信能力的插件，支持全权限调试和控制功能。

## 功能特性

- 🚀 **全权限访问**: 支持Bot重启、关闭、消息收发等完整控制
- 🔧 **Redis操作**: 完整的Redis数据库访问能力
- 📝 **消息处理**: 发送、撤回、获取历史消息
- 🔌 **插件管理**: 插件列表、信息查询、重载等
- 📁 **文件操作**: 读取、写入、列表、删除文件
- ⚡ **命令执行**: 执行系统命令
- 🧪 **测试功能**: 发送测试事件和消息
- 📊 **调试信息**: 内存、性能、日志监控
- 🌐 **HTTP API**: RESTful API接口
- 🔌 **WebSocket**: 实时双向通信

## 安装

1. 将插件文件夹放置到 `plugins/` 目录下
2. 重启Yunzai-Bot
3. 插件会自动启动MCP服务器

## 配置

配置文件位于 `config/config.yaml`，首次运行会自动从 `config/defSet.yaml` 复制默认配置。

### 主要配置项

```yaml
mcp:
  server:
    enabled: true          # 是否启用MCP服务器
    path: "/MCP"            # API路径
    apiKey: "mcp-yunzai-2024"  # API密钥
    verbose: true          # 详细日志
    
  permissions:
    allowRestart: true     # 允许重启Bot
    allowShutdown: true    # 允许关闭Bot
    allowRedis: true       # 允许Redis访问
    allowSendMessage: true # 允许发送消息
    # ... 更多权限配置
```

## 使用方法

### 基本命令

- `#mcp` - 显示帮助信息
- `#mcp状态` - 显示服务器状态
- `#mcp测试` - 运行连接测试
- `#mcp配置` - 显示当前配置
- `#mcp客户端` - 显示连接的客户端

### 调试命令

- `#mcp调试` - 显示调试菜单
- `#mcp内存` - 显示内存使用情况
- `#mcp性能` - 显示性能信息
- `#mcp事件 <类型>` - 发送测试事件
- `#mcp消息 <内容>` - 发送测试消息
- `#mcp redis <命令>` - 测试Redis操作
- `#mcp api <动作>` - 测试API调用
- `#mcp广播 <消息>` - 广播消息给所有客户端
- `#mcp压测` - 运行压力测试

## API接口

### HTTP API

基础URL: `http://localhost:2536/MCP`

#### 健康检查
```
GET /MCP/health
```

#### API调用
```
POST /MCP/api/{action}
Content-Type: application/json
X-API-Key: your-api-key

{
  "param1": "value1",
  "param2": "value2"
}
```

### WebSocket

连接地址: `ws://localhost:2536/MCP/ws`

#### 消息格式
```json
{
  "id": "unique-request-id",
  "action": "bot.status",
  "data": {
    "param1": "value1"
  }
}
```

#### 响应格式
```json
{
  "id": "unique-request-id",
  "success": true,
  "data": {
    "result": "data"
  },
  "timestamp": 1234567890
}
```

## 支持的API动作

### Bot控制
- `bot.restart` - 重启Bot
- `bot.shutdown` - 关闭Bot
- `bot.status` - 获取Bot状态
- `bot.info` - 获取Bot信息

### 消息操作
- `send.message` - 发送消息（通用接口）
  ```json
  {
    "target": "123456789",
    "message": "Hello World",
    "type": "private",  // private/group，默认private
    "bot_id": "bot1"    // 可选，指定Bot
  }
  ```
- `send.friend` - 发送好友消息
  ```json
  {
    "user_id": "123456789",
    "message": "Hello Friend",
    "bot_id": "bot1"  // 可选
  }
  ```
- `send.group` - 发送群消息
  ```json
  {
    "group_id": "987654321",
    "message": "Hello Group",
    "bot_id": "bot1"  // 可选
  }
  ```
- `recall.message` - 撤回消息
  ```json
  {
    "message_id": "msg_id",
    "type": "private",     // private/group
    "user_id": "123456789", // 私聊时使用
    "group_id": "987654321", // 群聊时使用
    "bot_id": "bot1"       // 可选
  }
  ```
- `message.history` - 获取消息历史
  ```json
  {
    "type": "private",      // private/group
    "user_id": "123456789",  // 私聊历史
    "group_id": "987654321", // 群聊历史
    "count": 20,            // 获取数量，默认20
    "message_seq": 0,       // 消息序号，可选
    "bot_id": "bot1"        // 可选
  }
  ```
- `message.get` - 获取指定消息详情
  ```json
  {
    "message_id": "msg_id",
    "bot_id": "bot1"  // 可选
  }
  ```
- `message.forward` - 获取转发消息内容
  ```json
  {
    "message_id": "forward_msg_id",
    "bot_id": "bot1"  // 可选
  }
  ```

### Redis操作
- `redis.get` - 获取值
  ```json
  { "key": "test_key" }
  ```
- `redis.set` - 设置值
  ```json
  {
    "key": "test_key",
    "value": "test_value",
    "expire": 3600  // 可选，过期时间（秒）
  }
  ```
- `redis.del` - 删除键
- `redis.keys` - 获取键列表
- `redis.info` - 获取Redis信息

### 插件管理
- `plugin.list` - 获取插件列表
- `plugin.info` - 获取插件信息
- `plugin.reload` - 重载插件
- `plugin.disable` - 禁用插件
- `plugin.enable` - 启用插件

### 文件操作
- `file.read` - 读取文件
  ```json
  {
    "filePath": "/path/to/file.txt",
    "encoding": "utf8"  // 可选
  }
  ```
- `file.write` - 写入文件
  ```json
  {
    "filePath": "/path/to/file.txt",
    "content": "file content",
    "encoding": "utf8"  // 可选
  }
  ```
- `file.list` - 列出目录
- `file.delete` - 删除文件

### 命令执行
- `command.execute` - 执行命令
  ```json
  {
    "command": "ls -la",
    "cwd": "/path/to/directory"  // 可选
  }
  ```

### 测试功能
- `test.event` - 发送测试事件
  ```json
  {
    "eventType": "test",
    "eventData": { "message": "test event" }
  }
  ```
- `test.message` - 发送测试消息
  ```json
  {
    "message": "test message",
    "sender": "test_user"  // 可选
  }
  ```

### 调试功能
- `debug.logs` - 获取日志
  ```json
  { "lines": 100 }  // 可选，默认100行
  ```
- `debug.memory` - 获取内存信息
- `debug.performance` - 获取性能信息

## 安全注意事项

⚠️ **重要**: 此插件提供了对Bot的完全控制权限，请确保：

1. 设置强密码的API密钥
2. 仅在受信任的网络环境中使用
3. 定期检查访问日志
4. 根据需要调整权限配置
5. 不要在生产环境中启用所有调试功能

## 示例代码

### Python客户端示例

```python
import requests
import json

class YunzaiMCPClient:
    def __init__(self, base_url="http://localhost:2536/MCP", api_key="mcp-yunzai-2024"):
        self.base_url = base_url
        self.headers = {
            "Content-Type": "application/json",
            "X-API-Key": api_key
        }
    
    def call_api(self, action, data=None):
        url = f"{self.base_url}/api/{action}"
        response = requests.post(url, headers=self.headers, json=data or {})
        return response.json()
    
    def get_bot_status(self):
        return self.call_api("bot.status")
    
    def send_message(self, target, message, msg_type="private"):
        return self.call_api("message.send", {
            "target": target,
            "message": message,
            "type": msg_type
        })
    
    def redis_get(self, key):
        return self.call_api("redis.get", {"key": key})

# 使用示例
client = YunzaiMCPClient()
status = client.get_bot_status()
print(f"Bot状态: {status}")

# 发送消息
result = client.send_message("123456789", "Hello from MCP!")
print(f"消息发送结果: {result}")
```

### JavaScript客户端示例

```javascript
class YunzaiMCPClient {
    constructor(baseUrl = 'http://localhost:2536/MCP', apiKey = 'mcp-yunzai-2024') {
        this.baseUrl = baseUrl;
        this.apiKey = apiKey;
    }
    
    async callAPI(action, data = {}) {
        const response = await fetch(`${this.baseUrl}/api/${action}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': this.apiKey
            },
            body: JSON.stringify(data)
        });
        
        return await response.json();
    }
    
    async getBotStatus() {
        return await this.callAPI('bot.status');
    }
    
    async sendMessage(target, message, type = 'private') {
        return await this.callAPI('message.send', {
            target,
            message,
            type
        });
    }
}

// 使用示例
const client = new YunzaiMCPClient();

client.getBotStatus().then(status => {
    console.log('Bot状态:', status);
});
```

## 故障排除

### 常见问题

1. **MCP服务器启动失败**
   - 检查端口是否被占用
   - 确认配置文件格式正确
   - 查看错误日志

2. **API调用返回401错误**
   - 检查API密钥是否正确
   - 确认请求头格式

3. **权限被拒绝错误**
   - 检查配置文件中的权限设置
   - 确认要调用的功能已启用

4. **WebSocket连接失败**
   - 检查防火墙设置
   - 确认WebSocket升级请求正确

### 日志查看

- 使用 `#mcp日志` 命令查看MCP请求日志
- 查看Yunzai主日志文件
- 使用 `#mcp调试` 命令进行详细调试

## 开发

### 项目结构

```
Yunzai-MCP-plugin/
├── index.js              # 插件入口
├── package.json          # 包配置
├── README.md            # 说明文档
├── config/
│   ├── defSet.yaml      # 默认配置
│   └── config.yaml      # 用户配置
├── lib/
│   ├── MCPServer.js     # MCP服务器
│   └── MCPHandler.js    # API处理器
└── apps/
    ├── mcp-control.js   # 控制命令
    └── mcp-debug.js     # 调试命令
```

### 扩展API

要添加新的API动作，在 `MCPHandler.js` 中的 `handleAction` 方法添加新的case：

```javascript
case 'your.new.action':
  return await this.handleYourNewAction(data);
```

然后实现对应的处理方法：

```javascript
async handleYourNewAction(data) {
  // 检查权限
  this.checkPermission('yourPermission');
  
  // 处理逻辑
  const result = await doSomething(data);
  
  return {
    success: true,
    data: result,
    timestamp: Date.now()
  };
}
```

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request！

## 更新日志

### v1.0.0
- 初始版本发布
- 支持基本的Bot控制功能
- 提供HTTP API和WebSocket接口
- 完整的权限管理系统
- 调试和测试功能

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
