// Compatibility wrapper for older configs pointing to "mode/dist/mcp-server.js"
import MCPServer from '../../model/dist/mcp-server.js'

const server = new MCPServer()
server.start()

