/**
 * 消息处理模块
 * 负责消息发送、撤回、历史记录等功能
 */
export declare class MessageHandler {
    constructor(config: any);
    /**
     * 检查权限
     * @param {string} permission 权限名称
     */
    checkPermission(permission: any): void;
    /**
     * 发送好友消息
     * @param {Object} data 消息数据
     * @returns {Object} 发送结果
     */
    sendFriendMessage(data: any): Promise<{
        success: boolean;
        action: string;
        data: {
            message_id: any;
            user_id: any;
            bot_id: any;
            message: any;
            timestamp: number;
        };
        timestamp: number;
        error?: undefined;
    } | {
        success: boolean;
        action: string;
        error: any;
        timestamp: number;
        data?: undefined;
    }>;
    /**
     * 发送群消息
     * @param {Object} data 消息数据
     * @returns {Object} 发送结果
     */
    sendGroupMessage(data: any): Promise<{
        success: boolean;
        action: string;
        data: {
            message_id: any;
            group_id: any;
            bot_id: any;
            message: any;
            timestamp: number;
        };
        timestamp: number;
        error?: undefined;
    } | {
        success: boolean;
        action: string;
        error: any;
        timestamp: number;
        data?: undefined;
    }>;
    /**
     * 撤回消息
     * @param {Object} data 撤回数据
     * @returns {Object} 撤回结果
     */
    recallMessage(data: any): Promise<{
        success: boolean;
        action: string;
        data: {
            message_id: any;
            type: any;
            user_id: any;
            group_id: any;
            bot_id: any;
            timestamp: number;
        };
        timestamp: number;
        error?: undefined;
    } | {
        success: boolean;
        action: string;
        error: any;
        timestamp: number;
        data?: undefined;
    }>;
    /**
     * 获取消息历史
     * @param {Object} data 查询参数
     * @returns {Object} 历史消息
     */
    getMessageHistory(data: any): Promise<{
        success: boolean;
        action: string;
        data: {
            type: any;
            user_id: any;
            group_id: any;
            count: any;
            message_seq: any;
            bot_id: any;
            messages: any;
            timestamp: number;
        };
        timestamp: number;
        error?: undefined;
    } | {
        success: boolean;
        action: string;
        error: any;
        timestamp: number;
        data?: undefined;
    }>;
    /**
     * 获取指定消息
     * @param {Object} data 查询参数
     * @returns {Object} 消息详情
     */
    getMessage(data: any): Promise<{
        success: boolean;
        action: string;
        data: {
            message_id: any;
            bot_id: any;
            message: any;
            timestamp: number;
        };
        timestamp: number;
        error?: undefined;
    } | {
        success: boolean;
        action: string;
        error: any;
        timestamp: number;
        data?: undefined;
    }>;
    /**
     * 获取转发消息内容
     * @param {Object} data 查询参数
     * @returns {Object} 转发消息内容
     */
    getForwardMessage(data: any): Promise<{
        success: boolean;
        action: string;
        data: {
            message_id: any;
            bot_id: any;
            forward_content: any;
            timestamp: number;
        };
        timestamp: number;
        error?: undefined;
    } | {
        success: boolean;
        action: string;
        error: any;
        timestamp: number;
        data?: undefined;
    }>;
}
