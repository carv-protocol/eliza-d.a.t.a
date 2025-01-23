import { Plugin } from "@elizaos/core";
import { fetchTransactionAction } from "./actions/fetchTransaction";
import { fetchTokenInfoAction } from "./actions/fetchTokenInfo";
import { ethereumDataProvider } from "./providers/ethereum/database";
import { transferAction } from "@elizaos/plugin-evm";
export const onchainDataPlugin: Plugin = {
    name: "onchain data plugin",
    description: "Enables onchain data fetching",
    actions: [fetchTokenInfoAction, fetchTransactionAction],
    providers: [],
    evaluators: [],
    services: [],
    clients: [],
};
