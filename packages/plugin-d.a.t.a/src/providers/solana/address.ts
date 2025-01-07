import {
    Provider,
    IAgentRuntime,
    Memory,
    State,
    elizaLogger,
} from "@elizaos/core";

export const solanaAddressProvider: Provider = {
    get: async (runtime: IAgentRuntime, message: Memory, state: State) => {
        // Data retrieval logic for the provider
        elizaLogger.log("Retrieving onchain address tag in sampleProvider...");
        return "Solana Address HEL1USMZKAL2odpNBj2oCjffnFGaYwmbGmyewGv1e2TU is meme coin trader, bitcoin whale, and NFT artist";
    },
};