# Yunzai-MCP-Plugin

实现LLM的插件自动化测试能力，从沙盒调试中解放出来

## 已实现的功能特性  
通过MCP工具，你的claude code/codex/augment/trae可以实现以下能力：
- 重启Bot
- 构造任意测试用户或测试群，实现 **包含button在内的消息段的** 收发
### 效果演示
![img.png](resources/演示.png)
### TO DO
~~- [ ] 内置Context Engine以减少agent阅读代码时的token消耗以及索引效率提升~~用别的MCP替代就行了  
~~- [ ] 对非合作Bot进行扫描、调试、风险评估、功能分析与二次开发~~ LLM会分不清，忽略  
~~- [ ] 针对国产模型优化，提升较小上下文窗口条件下的开发质量~~ glm-4.6的200k够用了




### 示例  
推荐使用[MCP ROUTER](https://github.com/mcp-router/mcp-router/)统筹管理
- Codex
````
[mcp_servers.mcp-router]
command = "C:\\Program Files\\nodejs\\node.exe" 
args = ["C:\\Users\\X\\AppData\\Roaming\\npm\\node_modules\\mcpr-cli\\dist\\mcpr.js", "connect"] 
env = { SystemRoot = 'C:\WINDOWS', COMSPEC = 'C:\WINDOWS\system32\cmd.exe' , MCPR_TOKEN = "mcpr_2gU3vMTLPcVjqJSY1KrPfPvJ848xDo5b" }
````  
- ClaudeCode
````
略
````
- 在你的IDE(例如Aug. Trae 等)中**以json格式**导入MCP时候直接使用，注意替换路径
```
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
      }
    }
  }
}

```
## 授权协议 (License)

本项目采用 **[MIT License](https://opensource.org/licenses/MIT) + [Commons Clause v1.0](https://commonsclause.com/)** 联合授权，在保持开源自由的同时阻止商业化滥用。

### MIT License
- 一份宽松许可证，允许自由使用、复制、修改、合并、出版、分发、再授权及销售软件副本，前提是保留原始版权声明。  
其中：
### Commons Clause v1.0
- 该附加条款明确**禁止“销售”**本软件。“销售”被广义定义，包括但不限于：
  - 将本软件或其主要功能作为付费产品或服务提供；
  - 将本软件或其主要功能作为商业 SaaS 的一部分提供；
  - 利用本软件开发闭源或收费的衍生或非衍生的插件 / 项目；
  - 其它涉及传销、诈骗、引流、变现等不合乎社会公序良俗的活动；  
  
### 使用须知
- **面向开源共享**：本项目服务于开源社区，Fork、Clone 或以任何方式使用即表示您已阅读并同意上述授权条款；
- **严禁商业滥用**：禁止将本项目的任何部分用于营利性闭源插件、传销、诈骗、引流、变现等违背社区精神或社会公序良俗的活动；

### 赞助与支持 
通过[我的AFF链接](https://www.bigmodel.cn/claude-code?ic=MIWBOWZZTI)购买GLM Coding可享受九折优惠
![img.png](resources/glm.png)
