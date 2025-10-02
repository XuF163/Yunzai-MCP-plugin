export declare class MockEnvironment {
    constructor(handler: any, options?: {});
    init(): {
        initialized: any;
        uin: any;
        nickname: any;
        friends: any;
        groups: any;
        outbox: any;
        inbox: any;
        adapter: any;
    };
    reset(): {
        initialized: any;
        uin: any;
        nickname: any;
        friends: any;
        groups: any;
        outbox: any;
        inbox: any;
        adapter: any;
    };
    status(): {
        initialized: any;
        uin: any;
        nickname: any;
        friends: any;
        groups: any;
        outbox: any;
        inbox: any;
        adapter: any;
    };
    ensureFriend(user_id: any, nickname?: string): any;
    ensureGroup(group_id: any, name?: string): any;
    ensureMessageImages(msg: any): Promise<void>;
    processImageSegment(item: any): Promise<void>;
    sanitizeFileName(name: any): string;
    writeImageBuffer(buffer: any, preferredName?: string): Promise<{
        finalName: string;
        relativePath: string;
    }>;
    fetchImageBuffer(url: any): Promise<Buffer<any>>;
    addFriend({ user_id, nickname }: {
        user_id: any;
        nickname: any;
    }): {
        added: boolean;
        friend: any;
    };
    removeFriend({ user_id }: {
        user_id: any;
    }): {
        removed: any;
        user_id: string;
    };
    listFriends(): unknown[];
    addGroup({ group_id, name }: {
        group_id: any;
        name: any;
    }): {
        added: boolean;
        group: any;
    };
    removeGroup({ group_id }: {
        group_id: any;
    }): {
        removed: any;
        group_id: string;
    };
    listGroups(): unknown[];
    addMember({ group_id, user_id, nickname, role }: {
        group_id: any;
        user_id: any;
        nickname: any;
        role?: string;
    }): {
        added: boolean;
        group_id: string;
        member: any;
    };
    removeMember({ group_id, user_id }: {
        group_id: any;
        user_id: any;
    }): {
        removed: boolean;
        reason: string;
        group_id?: undefined;
        user_id?: undefined;
    } | {
        removed: any;
        group_id: string;
        user_id: string;
        reason?: undefined;
    };
    listMembers({ group_id }: {
        group_id: any;
    }): unknown[];
    buildFriendApi(friend: any): {
        user_id: any;
        nickname: any;
        sendMsg(msg: any): Promise<{
            message_id: number;
        }>;
        recallMsg(message_id: any): Promise<{
            message_id: any;
            success: boolean;
        }>;
        getMsg(message_id: any): Promise<any>;
        getChatHistory(message_seq: any, count?: number): Promise<any[]>;
    };
    buildGroupApi(group: any): {
        group_id: any;
        name: any;
        pickMember(user_id: any): {
            user_id: string;
            group_id: string;
            getInfo: () => Promise<any>;
            getAvatarUrl: () => string;
        };
        sendMsg(msg: any): Promise<{
            message_id: number;
        }>;
        recallMsg(message_id: any): Promise<{
            message_id: any;
            success: boolean;
        }>;
        getMsg(message_id: any): Promise<any>;
        getChatHistory(message_seq: any, count?: number): Promise<any[]>;
    };
    findMessage(message_id: any): any;
    stringifyForLog(msg: any): string;
    sendFriend({ user_id, message }: {
        user_id: any;
        message: any;
    }): Promise<{
        message_id: number;
    }>;
    sendGroup({ group_id, message }: {
        group_id: any;
        message: any;
    }): Promise<{
        message_id: number;
    }>;
    history({ type, target, limit }: {
        type: any;
        target: any;
        limit?: number;
    }): {
        count: number;
        list: any[];
    };
    chatHistory(type: any, target: any, count: number, _seq: any): any[];
    _markRecalled(type: any, target: any, message_id: any): boolean;
    _attachToRecentBuffer(type: any, target: any, msg: any): void;
    formatMessageForLog(msg: any, type: any, target: any): Promise<string>;
    incomingMessage({ message, user_id, group_id, nickname, role, waitMs, traceId }: {
        message: any;
        user_id: any;
        group_id: any;
        nickname: any;
        role?: string;
        waitMs?: number;
        traceId: any;
    }): Promise<{
        success: boolean;
        action: string;
        data: {
            injected: {
                message_id: number;
                type: string;
                user_id: string;
                group_id: string;
                traceId: any;
            };
            responses: any;
            count: any;
            waitMs: number;
        };
        timestamp: number;
    }>;
}
