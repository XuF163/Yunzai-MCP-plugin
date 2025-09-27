/**
 * 文件管理模块
 * 负责文件的保存、读取、删除等操作
 */
export declare class FileManager {
    constructor(config: any);
    /**
     * 检查权限
     * @param {string} permission 权限名称
     */
    checkPermission(permission: any): void;
    /**
     * 确保目录存在
     * @param {string} dirPath 目录路径
     */
    ensureDir(dirPath: any): Promise<void>;
    /**
     * 保存图片文件
     * @param {Buffer} buffer 图片数据
     * @param {string} filePath 文件路径
     * @returns {Object} 保存结果
     */
    saveImageFile(buffer: any, filePath: any): Promise<{
        success: boolean;
        action: string;
        data: {
            path: any;
            size: number;
            created: Date;
            modified: Date;
            timestamp: number;
        };
        timestamp: number;
    }>;
    /**
     * 保存图片文件并注册到HTTP服务器
     * @param {Buffer} buffer 图片数据
     * @param {string} filePath 文件路径
     * @param {string} fileName 文件名
     * @returns {string} 文件URL
     */
    saveImageFileAndRegister(buffer: any, filePath: any, fileName: any): Promise<any>;
    /**
     * 读取文件
     * @param {Object} data 读取参数
     * @returns {Object} 文件内容
     */
    readFile(data: any): Promise<{
        success: boolean;
        action: string;
        data: {
            path: any;
            content: Buffer<ArrayBufferLike>;
            size: number;
            created: Date;
            modified: Date;
            encoding: any;
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
     * 写入文件
     * @param {Object} data 写入参数
     * @returns {Object} 写入结果
     */
    writeFile(data: any): Promise<{
        success: boolean;
        action: string;
        data: {
            path: any;
            size: number;
            created: Date;
            modified: Date;
            encoding: any;
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
     * 删除文件
     * @param {Object} data 删除参数
     * @returns {Object} 删除结果
     */
    deleteFile(data: any): Promise<{
        success: boolean;
        action: string;
        data: {
            path: any;
            size: number;
            deleted: boolean;
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
     * 列出目录内容
     * @param {Object} data 列表参数
     * @returns {Object} 目录内容
     */
    listDirectory(data: any): Promise<{
        success: boolean;
        action: string;
        data: {
            path: any;
            recursive: any;
            items: any[];
            count: number;
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
     * 获取文件信息
     * @param {Object} data 查询参数
     * @returns {Object} 文件信息
     */
    getFileInfo(data: any): Promise<{
        success: boolean;
        action: string;
        data: {
            path: any;
            type: string;
            size: number;
            created: Date;
            modified: Date;
            accessed: Date;
            permissions: number;
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
