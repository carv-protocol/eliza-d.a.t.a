import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { onchainDataPlugin as DataPlugin } from "../index";
import { defaultCharacter } from "@elizaos/core";
import type { IAgentRuntime } from "@elizaos/core";

describe("Data Plugin Integration", () => {
    let plugin: DataPlugin;

    // 扩展 mock runtime 以匹配 IAgentRuntime 接口
    const mockRuntime: Partial<IAgentRuntime> = {
        character: defaultCharacter,
        getSetting: vi.fn(),
        cacheManager: {
            get: vi.fn(),
            set: vi.fn(),
            delete: vi.fn(),
        },
        messageManager: {
            addEmbeddingToMemory: vi.fn(),
            getMemories: vi.fn(),
            searchMemories: vi.fn(),
            createMemory: vi.fn(),
            removeMemory: vi.fn(),
        },
        databaseAdapter: {
            init: vi.fn(),
            close: vi.fn(),
            getMemories: vi.fn(),
            searchMemories: vi.fn(),
            createMemory: vi.fn(),
            removeMemory: vi.fn(),
        },
    };

    beforeEach(() => {
        vi.clearAllMocks();
        plugin = new DataPlugin();

        // 设置默认的 mock 返回值
        mockRuntime.getSetting.mockReturnValue(undefined);
        mockRuntime.cacheManager.get.mockResolvedValue(null);
    });

    afterEach(() => {
        vi.clearAllTimers();
    });

    describe("Initialization", () => {
        it("should initialize with runtime", async () => {
            await plugin.initialize(mockRuntime as IAgentRuntime);
            expect(plugin.isInitialized()).toBe(true);
        });

        it("should register data provider", async () => {
            await plugin.initialize(mockRuntime as IAgentRuntime);
            const provider = plugin.getProvider();
            expect(provider).toBeDefined();
        });

        it("should handle initialization errors", async () => {
            mockRuntime.getSetting.mockImplementation(() => {
                throw new Error("Config error");
            });
            await expect(
                plugin.initialize(mockRuntime as IAgentRuntime)
            ).rejects.toThrow("Config error");
        });
    });

    describe("Data Operations", () => {
        beforeEach(async () => {
            await plugin.initialize(mockRuntime as IAgentRuntime);
        });

        it("should store and retrieve data", async () => {
            const provider = plugin.getProvider();
            const testData = { key: "value" };

            mockRuntime.cacheManager.set.mockResolvedValue(true);
            mockRuntime.cacheManager.get.mockResolvedValue(testData);

            await provider.storeData("test", testData);
            const result = await provider.getData("test");

            expect(result).toEqual(testData);
            expect(mockRuntime.cacheManager.set).toHaveBeenCalled();
            expect(mockRuntime.cacheManager.get).toHaveBeenCalled();
        });

        it("should handle data storage errors", async () => {
            const provider = plugin.getProvider();
            mockRuntime.cacheManager.set.mockRejectedValue(
                new Error("Storage error")
            );

            await expect(provider.storeData("test", {})).rejects.toThrow(
                "Storage error"
            );
        });

        it("should handle missing data gracefully", async () => {
            const provider = plugin.getProvider();
            mockRuntime.cacheManager.get.mockResolvedValue(null);

            const result = await provider.getData("nonexistent");
            expect(result).toBeNull();
        });
    });
});
