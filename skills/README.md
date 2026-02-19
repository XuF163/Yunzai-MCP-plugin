# skills

这里用于沉淀「不依赖 IDE」也能直接在命令行里做 Bot 功能测试/回归的通用方法与可复制脚本。

- `cli-bot-functional-testing/`：通过 `GET|POST /MCP/api/:action` + `mock.incoming.message` 注入消息，做插件指令级回归（支持群聊/私聊、等待聚合回复、日志检索）。

