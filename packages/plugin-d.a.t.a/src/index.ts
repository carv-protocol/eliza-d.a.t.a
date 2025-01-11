import { Plugin } from "@elizaos/core";
import { fetchTransactionAction } from "./actions/fetchTransaction";
import { ethereumDataProvider } from "./providers/ethereum/database";

export const onchainDataPlugin: Plugin = {
    name: "onchain data plugin",
    description: "Enables onchain data fetching",
    actions: [fetchTransactionAction],
    providers: [ethereumDataProvider],
    evaluators: [],
    // separate examples will be added for services and clients
    // services: [new DataService()],
    services: [],
    clients: [],
};
