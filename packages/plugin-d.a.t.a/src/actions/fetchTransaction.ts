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
    DatabaseProvider,
    databaseProvider,
} from "../providers/ethereum/database";
import { fetchTransactionTemplate } from "../templates";

// Query parameter interface with stricter types
interface FetchTransactionParams {
    address?: string;
    startDate?: string;
    endDate?: string;
    minValue?: string;
    maxValue?: string;
    limit?: number;
    orderBy?: "block_timestamp" | "value" | "gas_price";
    orderDirection?: "ASC" | "DESC";
}

// Response interface with enhanced metadata
interface TransactionQueryResult {
    success: boolean;
    data: any[];
    metadata: {
        total: number;
        queryTime: string;
        queryType: "transaction" | "token" | "aggregate" | "unknown";
        executionTime: number;
        cached: boolean;
        queryDetails?: {
            params: FetchTransactionParams;
            query: string;
            paramValidation?: string[];
        };
    };
    error?: {
        code: string;
        message: string;
        details?: any;
    };
}

export class FetchTransactionAction {
    constructor(private dbProvider: DatabaseProvider) {}

    private validateParams(params: FetchTransactionParams): string[] {
        const validationMessages: string[] = [];

        // Date format validation
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (params.startDate && !dateRegex.test(params.startDate)) {
            validationMessages.push(
                `Invalid start date format: ${params.startDate}`
            );
        }
        if (params.endDate && !dateRegex.test(params.endDate)) {
            validationMessages.push(
                `Invalid end date format: ${params.endDate}`
            );
        }

        // Address format validation
        if (params.address && !/^0x[a-fA-F0-9]{40}$/.test(params.address)) {
            validationMessages.push(
                `Invalid address format: ${params.address}`
            );
        }

        // Value validation
        if (params.minValue && isNaN(parseFloat(params.minValue))) {
            validationMessages.push(
                `Invalid minimum value: ${params.minValue}`
            );
        }
        if (params.maxValue && isNaN(parseFloat(params.maxValue))) {
            validationMessages.push(
                `Invalid maximum value: ${params.maxValue}`
            );
        }

        // Limit validation
        if (params.limit) {
            if (isNaN(params.limit)) {
                validationMessages.push(`Invalid limit: must be a number`);
            } else if (params.limit < 1 || params.limit > 100) {
                validationMessages.push(
                    `Invalid limit: ${params.limit}. Must be between 1 and 100`
                );
            }
        }

        // Order validation
        const validOrderBy = ["block_timestamp", "value", "gas_price"];
        if (params.orderBy && !validOrderBy.includes(params.orderBy)) {
            validationMessages.push(
                `Invalid orderBy: ${params.orderBy}. Must be one of: ${validOrderBy.join(
                    ", "
                )}`
            );
        }

        const validOrderDirection = ["ASC", "DESC"];
        if (
            params.orderDirection &&
            !validOrderDirection.includes(params.orderDirection)
        ) {
            validationMessages.push(
                `Invalid orderDirection: ${
                    params.orderDirection
                }. Must be one of: ${validOrderDirection.join(", ")}`
            );
        }

        return validationMessages;
    }

    private buildSqlQuery(params: FetchTransactionParams): string {
        const conditions: string[] = [];

        // Add time range condition
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

        // Add address condition
        if (params.address) {
            conditions.push(
                `(from_address = '${params.address}' OR to_address = '${params.address}')`
            );
        }

        // Add value conditions
        if (params.minValue) {
            // Convert ETH to Wei for comparison
            const minValueWei = (parseFloat(params.minValue) * 1e18).toString();
            conditions.push(`value >= ${minValueWei}`);
        }
        if (params.maxValue) {
            const maxValueWei = (parseFloat(params.maxValue) * 1e18).toString();
            conditions.push(`value <= ${maxValueWei}`);
        }

        // Build the final query
        const query = `
            SELECT
                hash,
                block_number,
                block_timestamp,
                from_address,
                to_address,
                value / 1e18 as value_eth,
                gas,
                gas_price
            FROM eth.transactions
            WHERE ${conditions.join(" AND ")}
            ORDER BY ${params.orderBy || "block_timestamp"} ${
                params.orderDirection || "DESC"
            }
            LIMIT ${params.limit || 10}
        `;

        return query.trim();
    }

    public async fetchTransactions(
        message: string,
        runtime: IAgentRuntime,
        state: State
    ): Promise<TransactionQueryResult> {
        try {
            // Parse parameters using LLM
            const context = composeContext({
                state,
                template: fetchTransactionTemplate,
            });

            const paramsJson = (await generateObject({
                runtime,
                context,
                modelClass: ModelClass.SMALL,
            })) as FetchTransactionParams;

            // Validate parameters
            const validationMessages = this.validateParams(paramsJson);
            if (validationMessages.length > 0) {
                throw new Error(validationMessages.join("; "));
            }

            // Build and execute query
            const sqlQuery = this.buildSqlQuery(paramsJson);
            elizaLogger.log("Generated SQL query:", sqlQuery);

            const result = (await this.dbProvider.query(
                sqlQuery
            )) as TransactionQueryResult;

            // Enhance result with query details
            if (result.success) {
                result.metadata.queryDetails = {
                    params: paramsJson,
                    query: sqlQuery,
                    paramValidation: validationMessages,
                };
            }

            return result;
        } catch (error) {
            elizaLogger.error("Error fetching transactions:", error);
            return {
                success: false,
                data: [],
                metadata: {
                    total: 0,
                    queryTime: new Date().toISOString(),
                    queryType: "transaction",
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

export const fetchTransactionAction: Action = {
    name: "fetch_transactions",
    description: "Fetch Ethereum transactions based on various criteria",
    similes: [
        "get transactions",
        "show transfers",
        "display eth transactions",
        "find transactions",
        "search transfers",
        "check transactions",
        "view transfers",
        "list transactions",
        "recent transactions",
        "transaction history",
    ],
    examples: [
        [
            {
                user: "user",
                content: {
                    text: "Show me the latest 10 Ethereum transactions",
                    action: "FETCH_TRANSACTIONS",
                },
            },
        ],
        [
            {
                user: "user",
                content: {
                    text: "Get transactions for address 0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
                    action: "FETCH_TRANSACTIONS",
                },
            },
        ],
        [
            {
                user: "user",
                content: {
                    text: "Find transactions above 1 ETH from last month",
                    action: "FETCH_TRANSACTIONS",
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
            const action = new FetchTransactionAction(provider);

            const result = await action.fetchTransactions(
                message.content.text,
                runtime,
                state
            );

            if (callback) {
                if (result.success) {
                    const params = result.metadata.queryDetails?.params;
                    let details = "";
                    if (params) {
                        details = `
- Address: ${params.address || "any"}
- Date Range: ${params.startDate || "last 3 months"} to ${
                            params.endDate || "now"
                        }
- Value Range: ${params.minValue ? `>${params.minValue} ETH` : "any"} ${
                            params.maxValue ? `to <${params.maxValue} ETH` : ""
                        }
- Showing: ${params.limit || 10} transactions
- Ordered by: ${params.orderBy || "timestamp"} ${
                            params.orderDirection || "DESC"
                        }`;
                    }

                    callback({
                        text: `Found ${
                            result.metadata.total
                        } transactions with the following criteria:${details}\n\nHere are the details:`,
                        content: {
                            success: true,
                            data: result.data,
                            metadata: result.metadata,
                        },
                    });
                } else {
                    callback({
                        text: `Error fetching transactions: ${result.error?.message}`,
                        content: { error: result.error },
                    });
                }
            }

            return result.success;
        } catch (error) {
            elizaLogger.error("Error in fetch transaction action:", error);
            if (callback) {
                callback({
                    text: `Error fetching transactions: ${error.message}`,
                    content: { error: error.message },
                });
            }
            return false;
        }
    },
};

export default fetchTransactionAction;
