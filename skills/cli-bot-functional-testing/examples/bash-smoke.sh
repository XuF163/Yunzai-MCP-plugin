#!/usr/bin/env bash
set -euo pipefail

BASE="${YUNZAI_MCP_BASE:-http://127.0.0.1:2536/MCP}"
KEY="${YUNZAI_MCP_KEY:-mcp-yunzai-2024}"

post () {
  local action="$1"
  local data="${2:-{}}"
  curl -sS -X POST "$BASE/api/$action" \
    -H "X-API-Key: $KEY" \
    -H "Content-Type: application/json" \
    -d "$data"
}

post bot.status '{}' >/dev/null
post mock.reset '{}' >/dev/null

GROUP_ID="g_smoke_1"
USER_ID="u_smoke_1"

post mock.group.add "{\"group_id\":\"$GROUP_ID\",\"name\":\"SmokeGroup\"}" >/dev/null
post mock.group.member.add "{\"group_id\":\"$GROUP_ID\",\"user_id\":\"$USER_ID\",\"nickname\":\"SmokeUser\",\"role\":\"member\"}" >/dev/null

post mock.incoming.message "{\"message\":\"#帮助\",\"user_id\":\"$USER_ID\",\"group_id\":\"$GROUP_ID\",\"waitMs\":6000,\"traceId\":\"smoke-help-001\"}"

