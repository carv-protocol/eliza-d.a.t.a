import {
    Action,
    HandlerCallback,
    IAgentRuntime,
    Memory,
    State,
    elizaLogger,
} from "@elizaos/core";
import {
    CarvIDProvider,
    TwitterBalanceParams,
    TwitterBalanceResponse,
    carvIDProvider,
} from "../../providers/carv/carv_id";

export class TwitterBalanceAction {
    constructor(
        private provider: CarvIDProvider,
        private runtime: IAgentRuntime
    ) {}

    private validateParams(params: TwitterBalanceParams): string[] {
        const validationMessages: string[] = [];

        // Twitter handle validation
        if (!params.twitter_user_id) {
            validationMessages.push("Twitter handle is required");
        }

        // Chain name validation
        if (!params.chain_name) {
            validationMessages.push("Chain name is required");
        }

        // Token ticker validation
        if (!params.token_ticker) {
            validationMessages.push("Token ticker is required");
        }

        return validationMessages;
    }

    private formatResponse(
        response: TwitterBalanceResponse,
        params: TwitterBalanceParams
    ): string {
        if (response.code === 0 && response.data) {
            return `🔍 Balance Information:
• Twitter User: @${params.twitter_user_id}
• Chain: ${params.chain_name}
• Token: ${params.token_ticker}
• Balance: ${response.data.balance} ${params.token_ticker.toUpperCase()}`;
        } else {
            switch (response.msg) {
                case "received rsp err twitter handle not found":
                    return "❌ Error: Twitter handle not found. Please check if the Twitter handle is correct.";
                case "no token found in this chain":
                    return "❌ Error: Token not found on this chain. Please verify the token ticker and chain name.";
                case "unsupported chain name":
                    return "❌ Error: Unsupported blockchain. Please check the chain name.";
                default:
                    return `❌ Error: ${response.msg || "Unknown error occurred"}`;
            }
        }
    }

    public async getTwitterBalance(
        message: Memory,
        state: State
    ): Promise<{ success: boolean; response: string; data?: any }> {
        try {
            // Use provider to process query
            const result = await this.provider.processBalanceQuery(
                this.runtime,
                message,
                state
            );

            if (!result) {
                return {
                    success: false,
                    response:
                        "❌ Error: Failed to process query. Please make sure to provide Twitter handle, chain name, and token ticker.",
                };
            }

            const { queryResult } = result;

            // Extract parameters from message for formatting
            const content = message.content as Record<string, string>;
            const params: TwitterBalanceParams = {
                twitter_user_id: content.twitter_user_id || "",
                chain_name: content.chain_name || "",
                token_ticker: content.token_ticker || "",
            };

            return {
                success: queryResult.code === 0,
                response: this.formatResponse(queryResult, params),
                data: queryResult.data,
            };
        } catch (error) {
            elizaLogger.error("Error in getTwitterBalance:", error);
            return {
                success: false,
                response: `❌ Error: ${error.message}`,
            };
        }
    }
}

export const twitterBalanceAction: Action = {
    name: "twitter_balance",
    description: "Check token balance of a Twitter user on specific blockchain",
    similes: [
        "check balance",
        "get token balance",
        "show token amount",
        "view balance",
        "check token holdings",
        "show wallet balance",
        "display token balance",
        "get holdings",
        "check account balance",
        "view token amount",
        "show crypto balance",
        "check token value",
        "get wallet holdings",
        "display account balance",
        "view holdings",
    ],
    examples: [
        [
            {
                user: "user",
                content: {
                    text: "Check CARV balance for Twitter user @gatsbyter on Arbitrum",
                    action: "TWITTER_BALANCE",
                    twitter_user_id: "gatsbyter",
                    chain_name: "arbitrum-one",
                    token_ticker: "carv",
                },
            },
        ],
        [
            {
                user: "user",
                content: {
                    text: "Show me how many AAVE tokens @vitalik has on Ethereum",
                    action: "TWITTER_BALANCE",
                    twitter_user_id: "vitalik",
                    chain_name: "ethereum",
                    token_ticker: "aave",
                },
            },
        ],
    ],
    validate: async (runtime: IAgentRuntime) => {
        return true; // No specific validation needed for this action
    },
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        _options: any,
        callback?: HandlerCallback
    ) => {
        try {
            const provider = carvIDProvider(runtime);
            const action = new TwitterBalanceAction(provider, runtime);
            const result = await action.getTwitterBalance(message, state);

            if (callback) {
                callback({
                    text: result.response,
                    content: {
                        success: result.success,
                        data: result.data,
                    },
                });
            }

            return result.success;
        } catch (error) {
            elizaLogger.error("Error in twitter balance action:", error);
            if (callback) {
                callback({
                    text: `Error checking balance: ${error.message}`,
                    content: { error: error.message },
                });
            }
            return false;
        }
    },
};

export default twitterBalanceAction;
