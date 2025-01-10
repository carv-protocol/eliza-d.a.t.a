import { Plugin } from "@elizaos/core";
import { fetchTransactionAction } from "./actions/fetchTransaction";
import { sequelizeProvider } from "./providers/ethereum/sequelize";

export const onchainDataPlugin: Plugin = {
    name: "onchain data plugin",
    description: "Enables onchain data fetching",
    actions: [fetchTransactionAction],
    providers: [sequelizeProvider],
    evaluators: [],
    // separate examples will be added for services and clients
    // services: [new DataService()],
    services: [],
    clients: [],
};
