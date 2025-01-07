import { Plugin } from "@elizaos/core";
import { solanaAddressProvider } from "./providers/solana/address";
import { dataEvaluator } from "./evaluators/data_evaluator";

const onchainDataPlugin: Plugin = {
    name: "onchain data plugin",
    description: "Enables onchain data fetching",
    actions: [],
    providers: [solanaAddressProvider],
    evaluators: [dataEvaluator],
    // separate examples will be added for services and clients
    services: [],
    clients: [],
};