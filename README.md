# Yunzai-MCP-Plugin

实现LLM的插件自动化测试能力，从沙盒调试中解放出来  
适用于[trss yunzai (V3)](https://gitee.com/TimeRainStarSky/Yunzai) ，项目时开发使用版本*f793f5a*(2025-01-03)
> [!WARNING]  
> 项目仅为内网环境开发环境、公共一次性测试实例设计；自用bot不建议端口暴露到公网，继续阅读即视为知晓风险
## 已实现的功能特性
够聪明的的LLM可以直接调度下列端点，碳基生物一般无需了解用法：

<details>
<summary><strong>MCP 工具</strong></summary>

| 工具名 | API 动作 | 分类 | 功能说明 | 关键参数/说明 |
| --- | --- | --- | --- | --- |
| `bot_status` | `bot.status` | Bot 管理 | 查询 Yunzai 当前运行状态、适配器、插件、路由与资源占用 | 无 |
| `bot_restart` | `bot.restart` | Bot 管理 | 触发延迟重启 Bot，可选强制模式 | `force`(可选), `delay`(毫秒) |
| `bot_shutdown` | `bot.shutdown` | Bot 管理 | 在指定延迟后优雅关闭 Bot 进程 | `delay`(毫秒) |
| `mock_incoming_message` | `mock.incoming.message` | 消息调试 | 向 Mock 适配器注入入站消息（单聊/群聊），可等待聚合回复 | `message`, `user_id`; 可选 `group_id`, `nickname`, `role`, `waitMs`, `traceId` |
| `mock_status` | `mock.status` | Mock 环境 | 查看 Mock 适配器初始化状态及收发统计 | 无 |
| `mock_friend_add` | `mock.friend.add` | Mock 环境 | 注册模拟好友档案，便于构造回放 | `user_id`; 可选 `nickname` |
| `mock_friend_remove` | `mock.friend.remove` | Mock 环境 | 移除指定模拟好友 | `user_id` |
| `mock_friend_list` | `mock.friend.list` | Mock 环境 | 列出全部模拟好友 | 无 |
| `mock_group_add` | `mock.group.add` | Mock 环境 | 创建模拟群并返回基本信息 | `group_id`; 可选 `name` |
| `mock_group_remove` | `mock.group.remove` | Mock 环境 | 删除指定模拟群 | `group_id` |
| `mock_group_list` | `mock.group.list` | Mock 环境 | 列出所有模拟群 | 无 |
| `mock_group_member_add` | `mock.group.member.add` | Mock 环境 | 向模拟群添加成员，支持角色设定 | `group_id`, `user_id`; 可选 `nickname`, `role` |
| `mock_group_member_remove` | `mock.group.member.remove` | Mock 环境 | 从模拟群移除指定成员 | `group_id`, `user_id` |
| `mock_group_members` | `mock.group.members` | Mock 环境 | 查询指定模拟群的成员列表 | `group_id` |
| `mock_history` | `mock.history` | Mock 环境 | 查看模拟适配器的收发历史（合并 inbox/outbox） | 可选 `type`, `target`, `limit` |
| `message_history` | `message.history` | 消息查询 | 获取指定会话的历史消息记录 | `type`; 可选 `user_id`, `group_id`, `count`, `message_seq`, `bot_id` |
| `message_get` | `message.get` | 消息查询 | 根据消息 ID 获取完整消息内容 | `message_id`; 可选 `bot_id` |
| `message_forward` | `message.forward` | 消息查询 | 获取合并转发消息的节点内容 | `message_id`; 可选 `bot_id` |
| `recall_message` | `recall.message` | 消息查询 | 撤回指定消息（Mock 侧同步标记撤回状态） | `message_id`; 可选 `type`, `user_id`, `group_id`, `bot_id` |

</details>

<details>
<summary><strong>HTTP API 扩展动作</strong></summary>

| API 动作 | 分类 | 功能说明 | 关键参数/说明 |
| --- | --- | --- | --- |
| `bot.info` | Bot 管理 | 列出当前注册的 Bot 实例（uin、昵称、状态、好友/群数量） | 无 |
| `time.get` | 时间服务 | 按指定时区返回当前时间戳、格式化结果与时间组件 | 可选 `timezone` |
| `time.format` | 时间服务 | 将给定时间戳格式化为指定模板 | `timestamp`; 可选 `format`, `timezone` |
| `time.diff` | 时间服务 | 计算起止时间差并返回多单位表示与人类可读描述 | `start`; 可选 `end`, `unit` |
| `time.timezone` | 时间服务 | 查看常用时区的当前时间与偏移信息 | 可选 `timezone` |
| `redis.get` | Redis 管理 | 读取 Redis 键值并返回存在状态 | `key` |
| `redis.set` | Redis 管理 | 写入 Redis 键值，可选过期秒数 | `key`, `value`; 可选 `expire` |
| `redis.del` | Redis 管理 | 删除一个或多个 Redis 键 | `key` 或 `keys[]` |
| `redis.keys` | Redis 管理 | 按模式列出 Redis 键并限制返回数量 | 可选 `pattern`, `limit` |
| `redis.info` | Redis 管理 | 汇总 Redis 服务器、内存、统计与键空间数据 | 无 |
| `redis.exists` | Redis 管理 | 判断单个或多个键是否存在 | `key` 或 `keys[]` |
| `redis.ttl` | Redis 管理 | 查询键的剩余过期时间及状态 | `key` |
| `redis.expire` | Redis 管理 | 为键设置过期秒数并返回预计过期时间 | `key`, `seconds` |
| `logs.get` | 日志管理 | 按条件抓取最近日志记录，支持级别与关键词过滤 | 可选 `lines`, `level`, `search`, `since`, `includeRaw` |
| `logs.clear` | 日志管理 | 清空日志缓冲区并返回清理数量 | 无 |
| `logs.stats` | 日志管理 | 获取日志数量、级别分布与最近窗口统计 | 无 |
| `logs.setLevel` | 日志管理 | 设置日志捕获级别并即时生效 | `level` |
| `logs.export` | 日志管理 | 按 JSON/CSV/TEXT 导出日志内容 | 可选 `format`, `level`, `search`, `since` |
| `file.read` | 文件服务 | 从安全目录读取文件内容与元数据 | `path`; 可选 `encoding` |
| `file.write` | 文件服务 | 写入/覆盖安全目录中的文件 | `path`, `content`; 可选 `encoding` |
| `file.delete` | 文件服务 | 删除安全目录中的文件并返回删除结果 | `path` |
| `file.list` | 文件服务 | 列出安全目录下的文件/文件夹，支持递归 | 可选 `path`, `recursive` |
| `file.info` | 文件服务 | 查看安全目录中文件/目录的详细属性 | `path` |
| `system.info` | 系统监控 | 返回操作系统、CPU、内存、网络等基础信息 | 无 |
| `system.stats` | 系统监控 | 获取进程、系统资源与磁盘使用等统计 | 无 |
| `system.processes` | 系统监控 | 列表化系统进程并按 CPU/内存排序 | 可选 `limit`, `sortBy` |
| `memory.info` | 系统监控 | 查看 Node 进程与主机内存使用详情 | 无 |
| `system.performance` | 系统监控 | 评估 CPU、事件循环延迟与运行时性能指标 | 无 |
| `network.ping` | 网络诊断 | 对指定主机执行 ping 并返回丢包/耗时统计 | `host`; 可选 `count`, `timeout` |
| `network.request` | 网络诊断 | 发送 HTTP(S) 请求并返回响应头与内容 | `url`; 可选 `method`, `headers`, `body`, `timeout` |
| `network.download` | 网络诊断 | 下载远程文件到 `data/mcp_client` 并返回路径 | `url`, `savePath` |
| `network.connectivity` | 网络诊断 | 测试预置站点连通性并统计在线情况 | 无 |
| `network.interfaces` | 网络诊断 | 列出主机网络接口及地址信息 | 无 |
| `network.testPort` | 网络诊断 | 测试目标主机端口连通性并返回响应耗时 | `host`, `port`; 可选 `timeout` |
| `render.template` | 渲染服务 | 调用渲染器生成模板截图并写入 `data/mcp_client` | `template`/`path`; 可选 `plugin`, `data`, `options` |
| `mock.init` | Mock 环境 | 初始化并注册 Mock 适配器实例 | 无 |
| `mock.reset` | Mock 环境 | 重置 Mock 适配器（好友/群/收发历史清空） | 无 |
| `mock.send.friend` | Mock 环境 | 通过 Mock 适配器向指定模拟好友发送消息，写入可回放的 outbox | `user_id`, `message` |
| `mock.send.group` | Mock 环境 | 通过 Mock 适配器向指定模拟群发送消息，写入可回放的 outbox | `group_id`, `message` |

</details>

> 修改功能权限请自行在 `config/config.yaml` 中配置
## 快速上手
````
git clone https://github.com/XuF163/Yunzai-MCP-plugin ./plugins/Yunzai-MCP-plugin
````  
gitee源  
```
git clone https://gitee.com/xyzqwefd/Yunzai-MCP-plugin ./plugins/Yunzai-MCP-plugin
```  
依赖安装
```
pnpm i
```
### 效果演示  
demo：使用[TRAE](https://www.trae.cn/) 国服免费版本进行测试
![img.png](resources/演示.png)
### TO DO
~~- [ ] 内置Context Engine以减少agent阅读代码时的token消耗以及索引效率提升~~用别的MCP替代就行了  
~~- [ ] 对非合作Bot进行扫描、调试、风险评估、功能分析与二次开发~~   
~~- [ ] 针对国产模型优化，提升较小上下文窗口条件下的开发质量~~ ~~glm-4.6的200k够用了~~用serena顶一下




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
        "C:\\Users\\X\\Desktop\\Bot-Dev\\Yunzai\\plugins\\Yunzai-MCP-plugin\\mode\\dist\\mcp-server.js"
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
- 宽松许可证，允许自由使用、复制、修改、合并、出版、分发、再授权及销售软件副本，前提是保留原始版权声明。  
其中：
### Commons Clause v1.0
- 该附加条款明确 **禁止“销售”** 本软件。“销售”被广义定义，包括但不限于：
  - 将本软件或其主要功能作为付费产品或服务提供；
  - 将本软件或其主要功能作为商业 SaaS 的一部分提供；
  - 利用本软件开发闭源或收费的衍生或非衍生的插件 / 项目；
  - 其它涉及传销、诈骗、引流、变现等不合乎社会公序良俗的活动；  
  
## 使用须知
- 本项目服务于开源社区，Fork、Clone 或以任何方式使用即表示您已阅读并同意上述授权条款；
- 禁止将本项目的任何部分用于营利性闭源插件、传销、诈骗、引流、变现等违背社区精神或社会公序良俗的活动；

## 赞助与支持 
通过[我的AFF链接](https://www.bigmodel.cn/claude-code?ic=MIWBOWZZTI)购买GLM Coding可享受九折优惠
![img.png](resources/glm.png)
