import {
    Provider,
    IAgentRuntime,
    Memory,
    State,
    elizaLogger,
    generateMessageResponse,
    ModelClass,
} from "@elizaos/core";
import { fetchTwitterBalanceTemplate } from "../../templates";

// API request parameters interface
export interface TwitterBalanceParams {
    twitter_user_id: string;
    chain_name: string;
    token_ticker: string;
}

// API response interface
export interface TwitterBalanceResponse {
    code: number;
    msg: string;
    data?: {
        balance: string;
    };
    detail?: string;
}

export class CarvIDProvider {
    private readonly API_BASE_URL: string;
    private readonly AUTH_TOKEN: string;

    constructor(private runtime: IAgentRuntime) {
        this.API_BASE_URL = runtime.getSetting("DATA_API_KEY");
        this.AUTH_TOKEN = runtime.getSetting("DATA_AUTH_TOKEN");
    }

    private extractParams(preResponse: any): TwitterBalanceParams | null {
        try {
            // Try to parse if input is string
            let jsonData = preResponse;
            if (typeof preResponse === "string") {
                try {
                    jsonData = JSON.parse(preResponse);
                } catch (e) {
                    elizaLogger.error(
                        "Failed to parse preResponse as JSON:",
                        e
                    );
                    return null;
                }
            }

            // Validate required parameters
            if (
                !jsonData.twitter_user_id ||
                !jsonData.chain_name ||
                !jsonData.token_ticker
            ) {
                elizaLogger.warn("Missing required parameters in response");
                return null;
            }

            return {
                twitter_user_id: jsonData.twitter_user_id,
                chain_name: jsonData.chain_name.toLowerCase(),
                token_ticker: jsonData.token_ticker.toLowerCase(),
            };
        } catch (error) {
            elizaLogger.error("Error in extractParams:", error);
            return null;
        }
    }

    private async fetchBalance(
        params: TwitterBalanceParams
    ): Promise<TwitterBalanceResponse> {
        try {
            const url = `${this.API_BASE_URL}/user_balance?twitter_user_id=${params.twitter_user_id}&chain_name=${params.chain_name}&token_ticker=${params.token_ticker}`;

            const response = await fetch(url, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: this.AUTH_TOKEN ? `${this.AUTH_TOKEN}` : "",
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data as TwitterBalanceResponse;
        } catch (error) {
            elizaLogger.error("Error fetching balance from API:", error);
            return {
                code: 5000,
                msg: "Failed to fetch balance",
                detail: error.message,
            };
        }
    }

    public async processBalanceQuery(
        runtime: IAgentRuntime,
        message: Memory,
        state: State
    ): Promise<{
        context: string;
        queryResult: TwitterBalanceResponse;
    } | null> {
        try {
            // Build context using template
            const template = fetchTwitterBalanceTemplate;
            const buildContext = template.replace(
                "{{recentMessages}}",
                message.content.text || ""
            );

            // Generate parameters using LLM
            const preResponse = await generateMessageResponse({
                runtime: runtime,
                context: buildContext,
                modelClass: ModelClass.LARGE,
            });

            // Extract parameters from LLM response
            const params = this.extractParams(preResponse);
            if (!params) {
                elizaLogger.warn(
                    "Failed to extract valid parameters from LLM response"
                );
                return null;
            }

            // Fetch balance using extracted parameters
            const queryResult = await this.fetchBalance(params);

            // Build response context
            const context = `
            # Query Parameters
            Twitter User: ${params.twitter_user_id}
            Chain: ${params.chain_name}
            Token: ${params.token_ticker}

            # Query Result
            ${JSON.stringify(queryResult, null, 2)}
            `;

            return {
                context,
                queryResult,
            };
        } catch (error) {
            elizaLogger.error("Error in processBalanceQuery:", error);
            return null;
        }
    }
}

export const carvIDProvider = (runtime: IAgentRuntime) => {
    return new CarvIDProvider(runtime);
};

export const carvIDDataProvider: Provider = {
    get: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State
    ): Promise<string | null> => {
        try {
            const isActionNone =
                message.content.action !== "NONE" &&
                message.content.action !== undefined &&
                message.content.action !== null;
            if (isActionNone) {
                elizaLogger.log(`actions: ${message.content.action}`);
                return null;
            }

            const provider = carvIDProvider(runtime);
            const result = await provider.processBalanceQuery(
                runtime,
                message,
                state
            );

            if (result) {
                return result.context;
            }

            return null;
        } catch (error) {
            elizaLogger.error("Error in carv ID provider:", error);
            return null;
        }
    },
};
