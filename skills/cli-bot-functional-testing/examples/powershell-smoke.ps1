$ErrorActionPreference = 'Stop'

$env:YUNZAI_MCP_BASE = $env:YUNZAI_MCP_BASE ?? 'http://127.0.0.1:2536/MCP'
$env:YUNZAI_MCP_KEY  = $env:YUNZAI_MCP_KEY  ?? 'mcp-yunzai-2024'

function Invoke-YunzaiMcp {
  param(
    [Parameter(Mandatory)][string]$Action,
    [Parameter()][hashtable]$Data = @{}
  )

  $uri = \"$($env:YUNZAI_MCP_BASE)/api/$Action\"
  $json  = $Data | ConvertTo-Json -Compress -Depth 20
  $bytes = [System.Text.Encoding]::UTF8.GetBytes($json)

  Invoke-RestMethod -Method Post -Uri $uri `
    -Headers @{ 'X-API-Key' = $env:YUNZAI_MCP_KEY } `
    -ContentType 'application/json; charset=utf-8' `
    -Body $bytes
}

Write-Host \"Base: $env:YUNZAI_MCP_BASE\"

Invoke-YunzaiMcp 'bot.status' @{} | Out-Null
Invoke-YunzaiMcp 'mock.reset' @{} | Out-Null

$groupId = 'g_smoke_1'
$userId  = 'u_smoke_1'

Invoke-YunzaiMcp 'mock.group.add' @{ group_id = $groupId; name = 'SmokeGroup' } | Out-Null
Invoke-YunzaiMcp 'mock.group.member.add' @{ group_id = $groupId; user_id = $userId; nickname = 'SmokeUser'; role = 'member' } | Out-Null

$r = Invoke-YunzaiMcp 'mock.incoming.message' @{
  message = '#帮助'
  user_id = $userId
  group_id = $groupId
  nickname = 'SmokeUser'
  role = 'member'
  waitMs = 6000
  traceId = 'smoke-help-001'
}

$payload = $r.data
if ($payload.success -and $payload.data) { $payload = $payload.data }

Write-Host \"Replies:\"
$payload.responses[0].responses | ConvertTo-Json -Depth 20

