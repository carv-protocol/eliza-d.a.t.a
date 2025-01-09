import {
  Evaluator,
  IAgentRuntime,
  Memory,
  elizaLogger,
} from "@elizaos/core";

export const dataEvaluator: Evaluator = {
  alwaysRun: false,
  name: "GET_ONCHAIN_DATA",
  similes: ["GET_ONCHAIN_INFO"],
  description: "Evaluates for onchain data",
  validate: async (runtime: IAgentRuntime, message: Memory) => true,
  handler: async (runtime: IAgentRuntime, message: Memory) => {
      // Evaluation logic here
      elizaLogger.log("GET_ONCHAIN_DATA evaluator handler called");
      return true;
  },
  examples: [],
};