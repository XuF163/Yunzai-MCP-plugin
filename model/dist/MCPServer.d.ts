export declare class MCPServer {
    constructor();
    loadConfig(): any;
    start(): Promise<void>;
    registerRoutes(): void;
    setupWebSocket(mcpPath: any): void;
    handleWebSocketConnection(ws: any, request: any): void;
    handleAPIRequest(req: any, res: any): Promise<any>;
    handleWebSocketMessage(clientId: any, message: any): Promise<void>;
    validateApiKey(req: any): boolean;
    logRequest(req: any, action: any): void;
    getCapabilities(): {
        actions: any[];
        features: {
            websocket: boolean;
            redis: boolean;
            file_operations: boolean;
            message_handling: boolean;
        };
        permissions: {
            botControl: any;
            redisAccess: any;
            messageHandling: any;
            pluginAccess: any;
            fileOperations: any;
            commandExecution: any;
        };
        version: string;
        server: string;
    };
    broadcast(message: any): void;
    getStatus(): {
        running: boolean;
        clients: any;
        requestHistory: any;
        config: any;
        uptime: number;
    };
}
