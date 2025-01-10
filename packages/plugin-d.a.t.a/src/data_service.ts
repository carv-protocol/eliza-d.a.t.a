import {
    IAgentRuntime,
    IMemoryManager,
    Service,
    Memory,
    MemoryManager,
} from "@elizaos/core";
import { stringToUuid, ServiceType } from "@elizaos/core";
import * as fs from "fs";
import * as path from "path";
import { txsArray } from "./txs.json.ts";
// const DATA_FILE_PATH = path.join(__dirname, "txs.json");

export const BLOCKCHAIN_DATA_TABLE_NAME = "d.a.t.a-blockchain-data";

type Transaction = {
    type: string;
    from: string;
    to: string;
    value: string;
    txHash: string;
    nonce: string;
    blockHash: string;
    blockNum: string;
};

export class DataService extends Service {
    static serviceType: ServiceType = ServiceType.INTIFACE;
    private runtime: IAgentRuntime | null = null;
    private blockchainDataManager: IMemoryManager | null = null;

    async initialize(runtime: IAgentRuntime): Promise<void> {
        console.log("Initializing carv data service");
        this.runtime = runtime;

        this.blockchainDataManager = new MemoryManager({
            runtime: runtime,
            tableName: BLOCKCHAIN_DATA_TABLE_NAME,
        });

        this.runtime.registerMemoryManager(this.blockchainDataManager);

        // console.log("Reading transactions from file...", DATA_FILE_PATH);
        // const txs = await readJsonFile(DATA_FILE_PATH);
        const txs = txsArray;
        for (const tx of txs) {
            console.log("Adding transaction to memory:", tx);

            const txInfo = formatTransaction(tx);
            const memory: Memory = {
                id: stringToUuid(txInfo),
                content: {
                    text: txInfo,
                },
                roomId: runtime.agentId,
                agentId: runtime.agentId,
                userId: runtime.agentId,
                createdAt: Date.now(),
            };
            await this.blockchainDataManager.addEmbeddingToMemory(memory);
            console.log("got memory:!!!!!");
            await this.blockchainDataManager.createMemory(memory);
        }
    }

    getBlockchainDataTableName(): string {
        return BLOCKCHAIN_DATA_TABLE_NAME;
    }
}

async function readJsonFile(filePath: string): Promise<Transaction[]> {
    try {
        // Read the file content
        const fileContent = await fs.readFileSync(filePath, "utf-8");

        // Parse the JSON content
        const jsonArray = JSON.parse(fileContent);

        // Check if the content is an array
        if (!Array.isArray(jsonArray)) {
            throw new Error("The file content is not a list of JSON objects.");
        }

        // Return the JSON objects
        return jsonArray as Transaction[];
    } catch (error) {
        console.error("Error reading or parsing the file:", error);
        throw error;
    }
}

function formatTransaction(transaction: Transaction): string {
    return `Transaction of type ${transaction.type} from ${transaction.from} to ${transaction.to} with value ${transaction.value}. Transaction hash: ${transaction.txHash}, nonce: ${transaction.nonce}, block hash: ${transaction.blockHash}, block number: ${transaction.blockNum}.`;
}
