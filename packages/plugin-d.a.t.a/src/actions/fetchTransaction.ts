import {
    composeContext,
    generateObjectDeprecated,
    ModelClass,
    Action,
    elizaLogger,
    type IAgentRuntime,
    type Memory,
    type State,
    HandlerCallback,
} from "@elizaos/core";

// Define the parameters schema for transaction queries
interface FetchTransactionParams {
    limit?: number;
    address?: string;
    startBlock?: number;
    endBlock?: number;
    startTime?: string;
    endTime?: string;
    orderBy?: "timestamp" | "blockNumber" | "value" | "gasUsed";
    orderDirection?: "ASC" | "DESC";
    minValue?: string;
    maxValue?: string;
    status?: boolean;
    tokenAddress?: string;
}

const buildQueryDetails = async (
    state: State,
    runtime: IAgentRuntime,
    message: Memory
): Promise<FetchTransactionParams> => {
    // Parse the message context to extract query parameters
    const context = message.content.text.toLowerCase();
    const params: FetchTransactionParams = {
        limit: 10, // default limit
        orderBy: "timestamp",
        orderDirection: "DESC",
    };

    const limitPatterns = [
        /(?:get|fetch|show|display)\s+(\d+)\s+transactions/,
        /last\s+(\d+)\s+transactions/,
        /recent\s+(\d+)\s+transactions/,
        /(\d+)\s+latest\s+transactions/,
    ];

    for (const pattern of limitPatterns) {
        const match = context.match(pattern);
        if (match) {
            params.limit = parseInt(match[1]);
            break;
        }
    }

    const addressPatterns = [
        /address[:\s]+([0x][a-fA-F0-9]{40})/,
        /wallet[:\s]+([0x][a-fA-F0-9]{40})/,
        /account[:\s]+([0x][a-fA-F0-9]{40})/,
        /from[:\s]+([0x][a-fA-F0-9]{40})/,
        /to[:\s]+([0x][a-fA-F0-9]{40})/,
    ];

    for (const pattern of addressPatterns) {
        const match = context.match(pattern);
        if (match) {
            params.address = match[1];
            break;
        }
    }

    const blockPatterns = [
        /block[s]?\s+(\d+)\s+to\s+(\d+)/,
        /from\s+block\s+(\d+)\s+to\s+(\d+)/,
        /between\s+block[s]?\s+(\d+)\s+and\s+(\d+)/,
    ];

    for (const pattern of blockPatterns) {
        const match = context.match(pattern);
        if (match) {
            params.startBlock = parseInt(match[1]);
            params.endBlock = parseInt(match[2]);
            break;
        }
    }

    const timePatterns = [
        /(?:in|from|since|after)\s+(yesterday|last week|last month|last year)/,
        /(?:from|since|after)\s+(\d{4}-\d{2}-\d{2})/,
        /between\s+(\d{4}-\d{2}-\d{2})\s+and\s+(\d{4}-\d{2}-\d{2})/,
    ];

    // for (const pattern of timePatterns) {
    //     const match = context.match(pattern);
    //     if (match) {
    //         if (match[1] === "yesterday") {
    //             params.startTime = new Date(
    //                 Date.now() - 86400000
    //             ).toISOString();
    //         } else if (match[1] === "last week") {
    //             params.startTime = new Date(
    //                 Date.now() - 7 * 86400000
    //             ).toISOString();
    //         } else if (match[1] === "last month") {
    //             params.startTime = new Date(
    //                 Date.now() - 30 * 86400000
    //             ).toISOString();
    //         } else if (match[1] === "last year") {
    //             params.startTime = new Date(
    //                 Date.now() - 365 * 86400000
    //             ).toISOString();
    //         } else if (match[2]) {
    //             params.startTime = new Date(match[1]).toISOString();
    //             params.endTime = new Date(match[2]).toISOString();
    //         }
    //         break;
    //     }
    // }

    // const valuePatterns = [
    //     /(?:above|more than|>)\s*(\d+(?:\.\d+)?)\s*(eth|ether)/i,
    //     /(?:below|less than|<)\s*(\d+(?:\.\d+)?)\s*(eth|ether)/i,
    //     /between\s*(\d+(?:\.\d+)?)\s*and\s*(\d+(?:\.\d+)?)\s*(eth|ether)/i,
    // ];

    // for (const pattern of valuePatterns) {
    //     const match = context.match(pattern);
    //     if (match) {
    //         const value = parseFloat(match[1]);
    //         if (pattern.source.includes("above|more than|>")) {
    //             params.minValue = (value * 1e18).toString(); // Convert ETH to Wei
    //         } else if (pattern.source.includes("below|less than|<")) {
    //             params.maxValue = (value * 1e18).toString();
    //         } else if (match[2]) {
    //             params.minValue = (value * 1e18).toString();
    //             params.maxValue = (parseFloat(match[2]) * 1e18).toString();
    //         }
    //         break;
    //     }
    // }

    // if (context.includes("failed") || context.includes("unsuccessful")) {
    //     params.status = false;
    // } else if (
    //     context.includes("successful") ||
    //     context.includes("confirmed")
    // ) {
    //     params.status = true;
    // }

    // if (context.includes("highest value") || context.includes("largest")) {
    //     params.orderBy = "value";
    //     params.orderDirection = "DESC";
    // } else if (
    //     context.includes("smallest") ||
    //     context.includes("lowest value")
    // ) {
    //     params.orderBy = "value";
    //     params.orderDirection = "ASC";
    // } else if (
    //     context.includes("highest gas") ||
    //     context.includes("most expensive")
    // ) {
    //     params.orderBy = "gasUsed";
    //     params.orderDirection = "DESC";
    // }

    return params;
};

const constructSqlQuery = (params: FetchTransactionParams): string => {
    let query = "SELECT * FROM ethereum_transactions";
    const conditions: string[] = [];

    if (params.address) {
        conditions.push(
            `(from_address = '${params.address}' OR to_address = '${params.address}')`
        );
    }

    if (params.startBlock) {
        conditions.push(`block_number >= ${params.startBlock}`);
    }

    if (params.endBlock) {
        conditions.push(`block_number <= ${params.endBlock}`);
    }

    if (params.startTime) {
        conditions.push(`block_timestamp >= '${params.startTime}'`);
    }

    if (params.endTime) {
        conditions.push(`block_timestamp <= '${params.endTime}'`);
    }

    if (params.minValue) {
        conditions.push(`value >= '${params.minValue}'`);
    }

    if (params.maxValue) {
        conditions.push(`value <= '${params.maxValue}'`);
    }

    if (params.status !== undefined) {
        conditions.push(`status = ${params.status}`);
    }

    if (params.tokenAddress) {
        conditions.push(`token_address = '${params.tokenAddress}'`);
    }

    if (conditions.length > 0) {
        query += " WHERE " + conditions.join(" AND ");
    }

    query += ` ORDER BY ${params.orderBy} ${params.orderDirection}`;
    query += ` LIMIT ${params.limit}`;

    return query;
};

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
        "transfer records",
        "eth movements",
        "wallet activity",
        "transaction lookup",
        "transfer search",
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
                    text: "Show me transactions above 10 ETH from last week",
                    action: "FETCH_TRANSACTIONS",
                },
            },
        ],
        [
            {
                user: "user",
                content: {
                    text: "Find failed transactions with highest gas fees",
                    action: "FETCH_TRANSACTIONS",
                },
            },
        ],
        [
            {
                user: "user",
                content: {
                    text: "Show me transactions between blocks 1000000 and 1000100",
                    action: "FETCH_TRANSACTIONS",
                },
            },
        ],
    ],
    validate: async (runtime: IAgentRuntime) => {
        // Add any necessary validation
        return true;
    },
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        _options: any,
        callback?: HandlerCallback
    ) => {
        try {
            elizaLogger.log("Fetching Ethereum transactions...");
            elizaLogger.log("message", message);

            // Build query parameters from message context
            const queryParams = await buildQueryDetails(
                state,
                runtime,
                message
            );

            // Construct SQL query
            const sqlQuery = constructSqlQuery(queryParams);
            elizaLogger.log("Generated SQL query:", sqlQuery);

            // Here we return the constructed query for the AI to use
            // The actual database query will be handled by the database provider
            if (callback) {
                callback({
                    text: `Here's the SQL query to retrieve Ethereum transactions:\n${sqlQuery}\nThis query will return the specified transactions, including details like transaction hash, block number, sender/receiver addresses, value, and gas used. Let me know if you'd like further analysis or specific details about any of these transactions!`,
                    content: {
                        success: true,
                        query: sqlQuery,
                        params: queryParams,
                    },
                });
            }
            return true;
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
