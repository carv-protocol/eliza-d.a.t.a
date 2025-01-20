import { IAgentRuntime, elizaLogger } from "@elizaos/core";

// Contract info interface
interface ContractInfo {
    platform: string;
    address: string;
}

// Token info interface matching API response structure
interface TokenInfo {
    ticker: string;
    symbol: string;
    name: string;
    platform: string;
    categories: string[];
    contract_infos: ContractInfo[];
    price: number;
}

// API response interface
interface TokenInfoApiResponse {
    code: number;
    msg: string;
    data: TokenInfo;
}

export class TokenInfoProvider {
    private readonly API_URL: string;
    private readonly AUTH_TOKEN: string;

    constructor(runtime: IAgentRuntime) {
        // Get API configuration from runtime settings
        this.API_URL = runtime.getSetting("TOKEN_INFO_API_URL");
        this.AUTH_TOKEN = runtime.getSetting("TOKEN_INFO_AUTH_TOKEN");
    }

    /**
     * Query token information by ticker
     * @param ticker The token ticker to query
     * @returns Promise<TokenInfo>
     */
    public async queryTokenInfo(ticker: string): Promise<TokenInfo> {
        try {
            elizaLogger.log(`Querying token info for ticker: ${ticker}`);

            // Build request URL
            const url = `${this.API_URL}/token_info?ticker=${encodeURIComponent(ticker.toLowerCase())}`;

            // Make API request
            const response = await fetch(url, {
                method: "GET",
                headers: {
                    Authorization: this.AUTH_TOKEN ? `${this.AUTH_TOKEN}` : "",
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                throw new Error(
                    `API request failed with status ${response.status}`
                );
            }

            const result = (await response.json()) as TokenInfoApiResponse;

            // Validate response
            if (result.code !== 0) {
                throw new Error(`API error: ${result.msg}`);
            }

            if (!result.data) {
                throw new Error("No token data returned from API");
            }

            elizaLogger.log(`Successfully retrieved token info for ${ticker}`);
            return result.data;
        } catch (error) {
            elizaLogger.error(
                `Error querying token info for ${ticker}:`,
                error
            );
            throw error;
        }
    }

    /**
     * Validate token info response
     * @param info TokenInfo object to validate
     * @returns boolean
     */
    private validateTokenInfo(info: TokenInfo): boolean {
        return !!(
            info.ticker &&
            info.symbol &&
            info.name &&
            info.platform &&
            Array.isArray(info.categories) &&
            Array.isArray(info.contract_infos) &&
            typeof info.price === "number"
        );
    }

    /**
     * Get supported platforms from a token's contract infos
     * @param info TokenInfo object
     * @returns string[] Array of supported platforms
     */
    public getSupportedPlatforms(info: TokenInfo): string[] {
        return info.contract_infos.map((contract) => contract.platform);
    }

    /**
     * Get contract address for a specific platform
     * @param info TokenInfo object
     * @param platform Platform to get address for
     * @returns string | undefined Contract address if found
     */
    public getContractAddress(
        info: TokenInfo,
        platform: string
    ): string | undefined {
        const contract = info.contract_infos.find(
            (c) => c.platform === platform
        );
        return contract?.address;
    }
}

// Export factory function to create provider instance
export const tokenInfoProvider = (runtime: IAgentRuntime) => {
    return new TokenInfoProvider(runtime);
};
