import { Plugin } from "@elizaos/core";
import { fetchTransactionAction } from "./actions/fetchTransaction";
import { ethereumDataProvider } from "./providers/ethereum/database";
import { transferAction } from "@elizaos/plugin-evm";
export const onchainDataPlugin: Plugin = {
    name: "onchain data plugin",
    description: "Enables onchain data fetching",
    actions: [],
    providers: [ethereumDataProvider],
    evaluators: [],
    // separate examples will be added for services and clients
    // services: [new DataService()],
    services: [],
    clients: [],
};
