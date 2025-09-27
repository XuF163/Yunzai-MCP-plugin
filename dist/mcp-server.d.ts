/**
 * Yunzai MCP Server - 独立的MCP服务器程序
 * 用于与IDE的MCP客户端进行通信
 */
declare class MCPServer {
    constructor();
    sendResponse(id: any, result?: any, error?: any): void;
    sendNotification(method: any, params?: {}): void;
    handleInitialize(id: any, params: any): Promise<void>;
    handleListTools(id: any): Promise<void>;
    handleCallTool(id: any, params: any): Promise<void>;
    handleMessage(message: any): Promise<void>;
    start(): void;
}
export default MCPServer;
