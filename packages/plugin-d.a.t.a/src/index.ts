import { Plugin } from "@elizaos/core";
import { EthTxsProvider } from "./providers/ethereum/txs";
import { dataEvaluator } from "./evaluators/data_evaluator";
import { DataService, BLOCKCHAIN_DATA_TABLE_NAME } from "./data_service";

const onchainDataPlugin: Plugin = {
    name: "onchain data plugin",
    description: "Enables onchain data fetching",
    actions: [],
    providers: [new EthTxsProvider(BLOCKCHAIN_DATA_TABLE_NAME)],
    evaluators: [dataEvaluator],
    // separate examples will be added for services and clients
    services: [new DataService()],
    clients: [],
};