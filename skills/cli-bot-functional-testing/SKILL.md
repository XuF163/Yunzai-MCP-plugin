# CLI Bot 功能测试（HTTP API + Mock）

目标：在 **PowerShell / CMD / Bash** 里，不连真实 QQ/频道号，也能对 Bot/插件做指令级功能回归。

本方法基于 `Yunzai-MCP-plugin` 暴露的 HTTP API：`GET|POST /MCP/api/:action`，核心入口是 `mock.incoming.message`（注入一条入站消息，并在 `waitMs` 时间内聚合机器人回复）。

## 0. 前置条件（一次性确认）

1) Bot 已启动，并加载 `Yunzai-MCP-plugin`

2) 知道两个配置值：

- **Base URL**：默认 `http://127.0.0.1:2536/MCP`（端口取决于你的 Yunzai 主端口）
- **API Key**：默认 `mcp-yunzai-2024`（见 `plugins/Yunzai-MCP-plugin/config/config.yaml`）

3) 健康检查（任意 Shell）

- `GET /MCP/health`

## 1. 通用测试流程（推荐）

1) 获取状态（确认服务在线）

- 动作：`bot.status`

2) 重置 Mock 环境（让回归可重复）

- 动作：`mock.reset`

3) 准备会话（可选）

> `mock.incoming.message` 会自动 `ensureFriend/ensureGroup/addMember`，所以这一步不是必须；但手动建群/加人更直观。

- 动作：`mock.group.add`
- 动作：`mock.group.member.add`

4) 注入指令并等待回复

- 动作：`mock.incoming.message`
- 建议参数：
  - `traceId`：给每条用例一个唯一标识，方便排查
  - `waitMs`：建议 `3000~8000`，首次触发某些插件可能更慢

5) 没有回复时的排查顺序

- 先把 `waitMs` 加大（很多“无回复”其实是等得不够）
- 用 `logs.get` 搜索关键词（例如插件名/指令文本/报错栈）
- 检查你发的是群聊还是私聊：带 `group_id` 才是群聊
- 如果指令含中文：确认请求体是 **UTF-8**（PowerShell/CMD 容易踩坑，下面有模板）

## 2. PowerShell 模板（最推荐，Unicode/JSON 最省心）

新开一个 PowerShell 窗口，先贴这个“通用函数”：

```powershell
$env:YUNZAI_MCP_BASE = 'http://127.0.0.1:2536/MCP'
$env:YUNZAI_MCP_KEY  = 'mcp-yunzai-2024'

function Invoke-YunzaiMcp {
  param(
    [Parameter(Mandatory)][string]$Action,
    [Parameter()][hashtable]$Data = @{}
  )

  $uri = \"$($env:YUNZAI_MCP_BASE)/api/$Action\"
  $json  = $Data | ConvertTo-Json -Compress -Depth 20
  # 关键：转 UTF-8 bytes，避免中文变成 ?? 导致正则匹配失败
  $bytes = [System.Text.Encoding]::UTF8.GetBytes($json)

  Invoke-RestMethod -Method Post -Uri $uri `
    -Headers @{ 'X-API-Key' = $env:YUNZAI_MCP_KEY } `
    -ContentType 'application/json; charset=utf-8' `
    -Body $bytes
}
```

常用动作：

```powershell
# 1) 在线状态
Invoke-YunzaiMcp 'bot.status' | ConvertTo-Json -Depth 10

# 2) 重置 Mock
Invoke-YunzaiMcp 'mock.reset' @{} | ConvertTo-Json -Depth 10

# 3) 注入一条群聊指令并等待 6s
$r = Invoke-YunzaiMcp 'mock.incoming.message' @{
  message = '#帮助'
  user_id = 'u_test_1'
  group_id = 'g_test_1'
  nickname = 'Tester'
  role = 'member'   # member|admin|owner（仅影响 sender.role）
  waitMs = 6000
  traceId = 'case-help-001'
}

# 注意：HTTP 包了一层 data，handler 内部又返回了 {success, action, data}
$payload = $r.data
if ($payload.success -and $payload.data) { $payload = $payload.data }
$payload.responses[0].responses | ConvertTo-Json -Depth 20

# 4) 查日志（关键词过滤）
Invoke-YunzaiMcp 'logs.get' @{ lines = 200; search = 'case-help-001' } | ConvertTo-Json -Depth 10
```

## 3. Bash (Git Bash / WSL) 模板（curl）

```bash
BASE='http://127.0.0.1:2536/MCP'
KEY='mcp-yunzai-2024'

curl -sS -X POST "$BASE/api/bot.status" \
  -H "X-API-Key: $KEY" -H "Content-Type: application/json" \
  -d '{}' | sed 's/\\\\u003e/>/g'

curl -sS -X POST "$BASE/api/mock.incoming.message" \
  -H "X-API-Key: $KEY" -H "Content-Type: application/json" \
  -d '{"message":"#帮助","user_id":"u1","group_id":"g1","waitMs":6000,"traceId":"case-help-001"}'
```

> 提示：如果你装了 `jq`，在末尾加 `| jq` 更好看。

## 4. CMD 模板（不推荐，但可用）

CMD 对 JSON 转义 + UTF-8 比较折磨；能用 PowerShell 就别用 CMD。

```bat
set BASE=http://127.0.0.1:2536/MCP
set KEY=mcp-yunzai-2024

curl -s -X POST "%BASE%/api/bot.status" ^
  -H "X-API-Key: %KEY%" -H "Content-Type: application/json" ^
  -d "{}"
```

如果一定要在 CMD 里发中文指令，建议先执行 `chcp 65001`，仍不保证所有环境都稳定；更稳的做法是改用 PowerShell。

## 5. 常用动作速查（功能测试常用）

- 状态：`bot.status` `bot.info`
- 注入入站消息（核心）：`mock.incoming.message`
- Mock 环境：`mock.reset` `mock.status` `mock.history`
- 日志检索：`logs.get`
- 消息追踪：`message.history` `message.get` `message.forward` `recall.message`
- 文件/渲染（插件会发图时很有用）：`render.template`（返回 `data/mcp_client/*` + 可访问的 `url`）

