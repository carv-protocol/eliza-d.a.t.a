import {
    Action,
    HandlerCallback,
    IAgentRuntime,
    Memory,
    State,
    elizaLogger,
} from "@elizaos/core";
import {
    DatabaseProvider,
    databaseProvider,
} from "../providers/ethereum/database";

// Query parameter interface
interface FetchTokenTransactionParams {
    tokenAddress?: string;
    address?: string;
    startDate?: string;
    endDate?: string;
    minValue?: string;
    maxValue?: string;
    limit?: number;
    orderBy?: "block_timestamp" | "value";
    orderDirection?: "ASC" | "DESC";
}

// Response interface matching database.ts
interface TokenTransactionQueryResult {
    success: boolean;
    data: any[];
    metadata: {
        total: number;
        queryTime: string;
        queryType: "token" | "transaction" | "aggregate" | "unknown";
        executionTime: number;
        cached: boolean;
    };
    error?: {
        code: string;
        message: string;
        details?: any;
    };
}

export class FetchTokenTransactionAction {
    constructor(private dbProvider: DatabaseProvider) {}

    private parseQueryParams(message: string): FetchTokenTransactionParams {
        const params: FetchTokenTransactionParams = {
            limit: 10,
            orderBy: "block_timestamp",
            orderDirection: "DESC",
        };

        // Extract token address
        const tokenMatch = message.match(
            /(?:token|contract)[:\s]+([0x][a-fA-F0-9]{40})/i
        );
        if (tokenMatch) {
            params.tokenAddress = tokenMatch[1];
        }

        // Extract wallet address
        const addressMatch = message.match(
            /(?:address|wallet|account|from|to)[:\s]+([0x][a-fA-F0-9]{40})/i
        );
        if (addressMatch) {
            params.address = addressMatch[1];
        }

        // Extract time range
        const timeMatch = message.match(
            /(?:from|since|after)\s+(\d{4}-\d{2}-\d{2})(?:\s+(?:to|until|before)\s+(\d{4}-\d{2}-\d{2}))?/i
        );
        if (timeMatch) {
            params.startDate = timeMatch[1];
            params.endDate = timeMatch[2];
        }

        // Extract value range (token amounts)
        const valueMatch = message.match(
            /(?:above|more than)\s*(\d+(?:\.\d+)?)/i
        );
        if (valueMatch) {
            params.minValue = valueMatch[1];
        }

        // Extract limit
        const limitMatch = message.match(
            /(?:show|get|fetch|display)\s+(\d+)\s+(?:transfers|transactions)/i
        );
        if (limitMatch) {
            params.limit = Math.min(parseInt(limitMatch[1]), 100); // Cap at 100
        }

        return params;
    }

    private buildSqlQuery(params: FetchTokenTransactionParams): string {
        const conditions: string[] = [];

        // Default time range if not specified
        if (!params.startDate) {
            conditions.push(
                "date_parse(date, '%Y-%m-%d') >= date_add('month', -3, current_date)"
            );
        } else {
            conditions.push(`date >= '${params.startDate}'`);
            if (params.endDate) {
                conditions.push(`date <= '${params.endDate}'`);
            }
        }

        // Token address is required
        if (params.tokenAddress) {
            conditions.push(`token_address = '${params.tokenAddress}'`);
        }

        // Filter by address if specified
        if (params.address) {
            conditions.push(
                `(from_address = '${params.address}' OR to_address = '${params.address}')`
            );
        }

        if (params.minValue) {
            conditions.push(`value >= ${params.minValue}`);
        }

        if (params.maxValue) {
            conditions.push(`value <= ${params.maxValue}`);
        }

        const query = `
            SELECT
                token_address,
                from_address,
                to_address,
                value,
                transaction_hash,
                block_number,
                block_timestamp,
                log_index
            FROM eth.token_transfers
            WHERE ${conditions.join(" AND ")}
            ORDER BY ${params.orderBy} ${params.orderDirection}
            LIMIT ${params.limit}
        `;

        return query.trim();
    }

    public async fetchTokenTransfers(
        message: string
    ): Promise<TokenTransactionQueryResult> {
        try {
            // Parse parameters from message
            const params = this.parseQueryParams(message);

            // Token address is required
            if (!params.tokenAddress) {
                throw new Error(
                    "Token address is required for token transfers query"
                );
            }

            // Build SQL query
            const sqlQuery = this.buildSqlQuery(params);
            elizaLogger.log("Generated token transfers SQL query:", sqlQuery);

            // Execute query using database provider
            return await this.dbProvider.query(sqlQuery);
        } catch (error) {
            elizaLogger.error("Error fetching token transfers:", error);
            return {
                success: false,
                data: [],
                metadata: {
                    total: 0,
                    queryTime: new Date().toISOString(),
                    queryType: "token",
                    executionTime: 0,
                    cached: false,
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

export const fetchTokenTransactionAction: Action = {
    name: "fetch_token_transfers",
    description: "Fetch ERC20 token transfers based on various criteria",
    similes: [
        "get token transfers",
        "show token transactions",
        "display token movements",
        "find token transfers",
        "search token transactions",
        "check token transfers",
        "view token movements",
        "list token transactions",
        "recent token transfers",
        "token transfer history",
    ],
    examples: [
        [
            {
                user: "user",
                content: {
                    text: "Show me the latest 10 transfers for token 0x1f9840a85d5af5bf1d1762f925bdaddc4201f984",
                    action: "FETCH_TOKEN_TRANSFERS",
                },
            },
        ],
        [
            {
                user: "user",
                content: {
                    text: "Get token transfers for address 0x742d35Cc6634C0532925a3b844Bc454e4438f44e token 0x1f9840a85d5af5bf1d1762f925bdaddc4201f984",
                    action: "FETCH_TOKEN_TRANSFERS",
                },
            },
        ],
    ],
    validate: async (runtime: IAgentRuntime) => {
        const apiKey = runtime.getSetting("DATA_API_KEY");
        const authToken = runtime.getSetting("DATA_AUTH_TOKEN");
        return !!(apiKey && authToken);
    },
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        _options: any,
        callback?: HandlerCallback
    ) => {
        try {
            const provider = databaseProvider(runtime);
            const action = new FetchTokenTransactionAction(provider);

            const result = await action.fetchTokenTransfers(
                message.content.text
            );

            if (callback) {
                if (result.success) {
                    callback({
                        text: `Found ${result.metadata.total} token transfers. Here are the details:`,
                        content: {
                            success: true,
                            data: result.data,
                            metadata: result.metadata,
                        },
                    });
                } else {
                    callback({
                        text: `Error fetching token transfers: ${result.error?.message}`,
                        content: { error: result.error },
                    });
                }
            }

            return result.success;
        } catch (error) {
            elizaLogger.error("Error in fetch token transfer action:", error);
            if (callback) {
                callback({
                    text: `Error fetching token transfers: ${error.message}`,
                    content: { error: error.message },
                });
            }
            return false;
        }
    },
};

export default fetchTokenTransactionAction;
