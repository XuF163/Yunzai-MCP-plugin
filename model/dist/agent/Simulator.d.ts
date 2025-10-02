export interface SimulateMessageInput {
    message: string | any[];
    user_id: string | number;
    group_id?: string | number;
    nickname?: string;
    role?: 'member' | 'admin' | 'owner';
    bot_id?: string | number;
    time?: number;
}
export declare class AgentSimulator {
    private handler;
    private config;
    constructor(handler: any, config?: any);
    simulateMessage(data: SimulateMessageInput): Promise<{
        success: boolean;
        error: any;
        action?: undefined;
        data?: undefined;
        timestamp?: undefined;
    } | {
        success: boolean;
        action: string;
        data: {
            message_type: string;
            user_id: string;
            message: string;
            timestamp: number;
            self_id: string;
        };
        timestamp: number;
        error?: undefined;
    }>;
    simulatePrivateMessage(data: SimulateMessageInput): Promise<{
        success: boolean;
        action: string;
        data: {
            message_type: string;
            user_id: string;
            message: string;
            timestamp: number;
            self_id: string;
        };
        timestamp: number;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        action?: undefined;
        data?: undefined;
        timestamp?: undefined;
    }>;
    simulateGroupMessage(data: SimulateMessageInput): Promise<{
        success: boolean;
        action: string;
        data: {
            message_type: string;
            group_id: string;
            user_id: string;
            message: string;
            timestamp: number;
            self_id: string;
        };
        timestamp: number;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        action?: undefined;
        data?: undefined;
        timestamp?: undefined;
    }>;
    private normalizeMessage;
    private stringifyForLog;
    private pickBot;
}
