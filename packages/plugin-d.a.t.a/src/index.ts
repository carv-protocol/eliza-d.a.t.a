import { Plugin } from "@elizaos/core";
import { fetchTransactionAction } from "./actions/fetchTransaction";
import { fetchTokenInfoAction } from "./actions/fetchTokenInfo";
import { ethereumDataProvider } from "./providers/ethereum/ethereumData";
import { tokenInfoProvider } from "./providers/token/tokenInfo";
import { twitterBalanceAction } from "./actions/carv/twitterBalance";
import { twitterBalanceProvider } from "./providers/carv/twitterBalance";

export const onchainDataPlugin: Plugin = {
    name: "onchain data plugin",
    description: "Enables onchain data fetching",
    actions: [],
    providers: [ethereumDataProvider],
    evaluators: [],
    services: [],
    clients: [],
};
