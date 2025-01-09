import {
  Provider,
  IAgentRuntime,
  Memory,
  State,
  elizaLogger,
  embed,
} from "@elizaos/core";

const relativeTxsCount = 100;

export class EthTxsProvider implements Provider {
constructor(private blockchainDataTableName: string) {}
async get(runtime: IAgentRuntime, message: Memory, state: State): Promise<string | null> {
      // Data retrieval logic for the provider
      const blockchainDataRuntimeManager = runtime.getMemoryManager(this.blockchainDataTableName);
      elizaLogger.log("Retrieving onchain eth txs from blockchain data runtime manager...");

      const embedding = await embed(runtime, message.content.text);
      const memories = await blockchainDataRuntimeManager.searchMemoriesByEmbedding(
        embedding,
        {
            roomId: message.agentId,
            count: relativeTxsCount,
            match_threshold: 0.1,
        }
      );
      return concatenateMemories(memories);
  }
};

function concatenateMemories(memories: Memory[]): string {
  const prefix = "A list of relevant on-chain ethereum txs content: ";
  const concatenatedContent = memories.map(memory => memory.content.text).join(' ');
  return prefix + concatenatedContent;
}