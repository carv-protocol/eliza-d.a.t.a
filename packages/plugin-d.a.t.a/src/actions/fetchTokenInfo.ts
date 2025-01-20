import {
    Action,
    HandlerCallback,
    IAgentRuntime,
    Memory,
    State,
    elizaLogger,
    composeContext,
    generateObject,
    ModelClass,
} from "@elizaos/core";
import {
    TokenInfoProvider,
    tokenInfoProvider,
} from "../providers/token/tokenInfo";
import { fetchTokenInfoTemplate } from "../templates";

// Query parameter interface
interface FetchTokenInfoParams {
    symbol: string; // Token symbol (e.g., "CARV")
    platform?: string; // Specific platform to query (optional)
}

// Response interface with metadata
interface TokenInfoQueryResult {
    success: boolean;
    data: {
        ticker: string;
        symbol: string;
        name: string;
        platform: string;
        categories: string[];
        contract_infos: Array<{
            platform: string;
            address: string;
        }>;
        price: number;
    };
    metadata: {
        queryTime: string;
        executionTime: number;
        queryDetails?: {
            params: FetchTokenInfoParams;
        };
    };
    error?: {
        code: string;
        message: string;
        details?: any;
    };
}

export class FetchTokenInfoAction {
    constructor(private provider: TokenInfoProvider) {}

    /**
     * Validate query parameters
     */
    private validateParams(params: FetchTokenInfoParams): string[] {
        const validationMessages: string[] = [];

        if (!params.symbol) {
            validationMessages.push("Token symbol is required");
        }

        // Remove any $ prefix from symbol
        if (params.symbol?.startsWith("$")) {
            params.symbol = params.symbol.substring(1);
        }

        // Additional validations as needed
        if (params.platform && typeof params.platform !== "string") {
            validationMessages.push("Platform must be a string if provided");
        }

        return validationMessages;
    }

    /**
     * Format categories into readable text
     */
    private formatCategories(categories: string[]): string {
        if (!categories.length) {
            return "No categories available";
        }
        return categories.join(", ");
    }

    /**
     * Format contract addresses into readable text
     */
    private formatContractAddresses(
        contractInfos: Array<{ platform: string; address: string }>
    ): string {
        if (!contractInfos.length) {
            return "No contract addresses available";
        }

        return contractInfos
            .map(
                (info) =>
                    `- ${info.platform.charAt(0).toUpperCase() + info.platform.slice(1)}: ${info.address}`
            )
            .join("\n");
    }

    /**
     * Format price information with fallback message
     */
    private formatPriceInfo(price: number): string {
        if (!price) {
            return "Price information is currently unavailable. Please try again later.";
        }
        return `$${price.toFixed(6)}`;
    }

    /**
     * Process token info into natural language response
     */
    public processTokenInfo(info: TokenInfoQueryResult["data"]): string {
        const priceInfo = this.formatPriceInfo(info.price);
        const categoriesInfo = this.formatCategories(info.categories);
        const contractsInfo = this.formatContractAddresses(info.contract_infos);

        return `
Token Information for ${info.name} (${info.symbol}):

Price: ${priceInfo}

Categories/Use Cases:
${categoriesInfo}

Deployed Contracts:
${contractsInfo}

This token is available on ${info.contract_infos.length} platform${
            info.contract_infos.length !== 1 ? "s" : ""
        }.
`;
    }

    /**
     * Fetch token information
     */
    public async fetchTokenInfo(
        message: string,
        runtime: IAgentRuntime,
        state: State
    ): Promise<TokenInfoQueryResult> {
        try {
            // Parse parameters using LLM
            const context = composeContext({
                state,
                template: fetchTokenInfoTemplate,
            });

            const paramsJson = (await generateObject({
                runtime,
                context,
                modelClass: ModelClass.SMALL,
            })) as unknown as FetchTokenInfoParams;

            // Validate parameters
            const validationMessages = this.validateParams(paramsJson);
            if (validationMessages.length > 0) {
                throw new Error(validationMessages.join("; "));
            }

            elizaLogger.log(
                `Fetching token info for symbol: ${paramsJson.symbol}`
            );
            const startTime = Date.now();

            // Query token info
            const tokenInfo = await this.provider.queryTokenInfo(
                paramsJson.symbol
            );

            // Prepare result
            const result: TokenInfoQueryResult = {
                success: true,
                data: tokenInfo,
                metadata: {
                    queryTime: new Date().toISOString(),
                    executionTime: Date.now() - startTime,
                    queryDetails: {
                        params: paramsJson,
                    },
                },
            };

            return result;
        } catch (error) {
            elizaLogger.error("Error fetching token info:", error);
            return {
                success: false,
                data: null,
                metadata: {
                    queryTime: new Date().toISOString(),
                    executionTime: 0,
                },
                error: {
                    code: "FETCH_ERROR",
                    message: error.message,
                    details: error,
                },
            };
        }
    }
}

export const fetchTokenInfoAction: Action = {
    name: "FETCH_TOKEN_INFO",
    description:
        "Fetch and analyze token information including deployment, categories, and price",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        _options: any,
        callback?: HandlerCallback
    ) => {
        try {
            const provider = tokenInfoProvider(runtime);
            const action = new FetchTokenInfoAction(provider);

            const result = await action.fetchTokenInfo(
                message.content.text,
                runtime,
                state
            );

            if (callback) {
                if (result.success) {
                    const analysisText = action.processTokenInfo(result.data);
                    callback({
                        text: analysisText,
                        content: {
                            success: true,
                            data: result.data,
                            metadata: result.metadata,
                        },
                    });
                } else {
                    callback({
                        text: `Error fetching token info: ${result.error?.message}`,
                        content: { error: result.error },
                    });
                }
            }

            return result.success;
        } catch (error) {
            elizaLogger.error("Error in fetch token info action:", error);
            if (callback) {
                callback({
                    text: `Error analyzing token: ${error.message}`,
                    content: { error: error.message },
                });
            }
            return false;
        }
    },
    validate: async (runtime: IAgentRuntime) => {
        const apiKey = runtime.getSetting("TOKEN_INFO_API_KEY");
        const authToken = runtime.getSetting("TOKEN_INFO_AUTH_TOKEN");
        return !!(apiKey && authToken);
    },
    examples: [
        [
            {
                user: "user",
                content: {
                    text: "Can you tell me about the CARV token?",
                    action: "FETCH_TOKEN_INFO",
                },
            },
            {
                user: "assistant",
                content: {
                    text: "I'll help you analyze the CARV token",
                    action: "FETCH_TOKEN_INFO",
                },
            },
        ],
        [
            {
                user: "user",
                content: {
                    text: "What's the current price of CARV?",
                    action: "FETCH_TOKEN_INFO",
                },
            },
            {
                user: "assistant",
                content: {
                    text: "Let me check the current price and details for CARV",
                    action: "FETCH_TOKEN_INFO",
                },
            },
        ],
        [
            {
                user: "user",
                content: {
                    text: "Which chains is CARV deployed on?",
                    action: "FETCH_TOKEN_INFO",
                },
            },
            {
                user: "assistant",
                content: {
                    text: "I'll look up the deployment information for CARV across different blockchains",
                    action: "FETCH_TOKEN_INFO",
                },
            },
        ],
        [
            {
                user: "user",
                content: {
                    text: "What category is CARV in?",
                    action: "FETCH_TOKEN_INFO",
                },
            },
            {
                user: "assistant",
                content: {
                    text: "I'll check the categories and use cases for CARV",
                    action: "FETCH_TOKEN_INFO",
                },
            },
        ],
        [
            {
                user: "user",
                content: {
                    text: "analyze CARV for me",
                    action: "FETCH_TOKEN_INFO",
                },
            },
            {
                user: "assistant",
                content: {
                    text: "I'll provide a comprehensive analysis of the CARV token",
                    action: "FETCH_TOKEN_INFO",
                },
            },
        ],
        [
            {
                user: "user",
                content: {
                    text: "CARV contract address?",
                    action: "FETCH_TOKEN_INFO",
                },
            },
            {
                user: "assistant",
                content: {
                    text: "I'll find the contract addresses for CARV across different platforms",
                    action: "FETCH_TOKEN_INFO",
                },
            },
        ],
        [
            {
                user: "user",
                content: {
                    text: "show me $CARV info",
                    action: "FETCH_TOKEN_INFO",
                },
            },
            {
                user: "assistant",
                content: {
                    text: "Here's what I found about the CARV token",
                    action: "FETCH_TOKEN_INFO",
                },
            },
        ],
        [
            {
                user: "user",
                content: {
                    text: "what's $CARV used for?",
                    action: "FETCH_TOKEN_INFO",
                },
            },
            {
                user: "assistant",
                content: {
                    text: "I'll check the use cases and categories for CARV",
                    action: "FETCH_TOKEN_INFO",
                },
            },
        ],
    ],
    similes: [
        "GET_TOKEN_INFO",
        "TOKEN_ANALYSIS",
        "CHECK_TOKEN",
        "TOKEN_DETAILS",
        "TOKEN_PRICE",
        "TOKEN_PLATFORMS",
        "TOKEN_CATEGORIES",
        "ANALYZE_TOKEN",
        "TOKEN_CHECK",
        "TOKEN_LOOKUP",
        "SHOW_TOKEN",
        "FIND_TOKEN",
        "TOKEN_SEARCH",
        "TOKEN_STATUS",
        "TOKEN_REPORT",
    ],
};

export default fetchTokenInfoAction;
