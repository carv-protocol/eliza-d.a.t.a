import { Plugin } from "@elizaos/core";
import { fetchTransactionAction } from "./actions/fetchTransaction";
import { fetchTokenInfoAction } from "./actions/fetchTokenInfo";
import { ethereumDataProvider } from "./providers/ethereum/database";
import { tokenInfoProvider } from "./providers/token/tokenInfo";

export const onchainDataPlugin: Plugin = {
    name: "onchain data plugin",
    description: "Enables onchain data fetching",
    actions: [],
    providers: [tokenInfoProvider, ethereumDataProvider],
    evaluators: [],
    services: [],
    clients: [],
};
