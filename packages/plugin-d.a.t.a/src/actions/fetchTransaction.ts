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
        blockStats?: {
            blockRange: {
                startBlock: string;
                endBlock: string;
                blockCount: number;
            };
            timeRange: {
                startTime: string;
                endTime: string;
                timeSpanSeconds: number;
            };
            uniqueBlocks: number;
            averageTransactionsPerBlock: number;
        };
        transactionStats?: {
            uniqueFromAddresses: number;
            uniqueToAddresses: number;
            txTypeDistribution: Record<string, number>;
            gasStats: {
                totalGasUsed: number;
                averageGasUsed: number;
                minGasUsed: number;
                maxGasUsed: number;
                averageGasPrice: number;
                totalGasCost: string; // in ETH
            };
            valueStats: {
                totalValue: string; // in ETH
                averageValue: string; // in ETH
                minValue: string; // in ETH
                maxValue: string; // in ETH
                zeroValueCount: number;
            };
            contractStats: {
                contractTransactions: number;
                normalTransactions: number;
                contractInteractions: {
                    uniqueContracts: number;
                    topContracts: Array<{
                        address: string;
                        count: number;
                    }>;
                };
            };
            addressStats: {
                topSenders: Array<{
                    address: string;
                    count: number;
                    totalValue: string; // in ETH
                }>;
                topReceivers: Array<{
                    address: string;
                    count: number;
                    totalValue: string; // in ETH
                }>;
            };
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
        message: Memory,
        runtime: IAgentRuntime,
        state: State
    ): Promise<{
        type: "analysis" | "transaction";
        result: string | TransactionQueryResult;
    } | null> {
        let transactionResult: any;
        let analysisResult: any;
        try {
            const ret = await this.dbProvider.processD_A_T_AQuery(
                runtime,
                message,
                state
            );

            if (!ret || !ret.queryResult) {
                throw new Error("Failed to fetch transactions");
            }

            transactionResult = ret.queryResult as TransactionQueryResult;

            // Try to get analysis
            const analysisResult = await this.dbProvider.analyzeQuery(
                transactionResult,
                runtime
            );

            // If analysis fails, return transaction result
            if (!analysisResult) {
                return {
                    type: "transaction",
                    result: transactionResult,
                };
            }

            // If analysis succeeds, return analysis result
            return {
                type: "analysis",
                result: analysisResult,
            };
        } catch (error) {
            elizaLogger.error("Error fetching transactions:", error);
            return null;
        }
    }

    private calculateAddressStats(transactions: any[]) {
        const addressMap = new Map<
            string,
            {
                sendCount: number;
                receiveCount: number;
                sendValue: number;
                receiveValue: number;
            }
        >();

        transactions.forEach((tx) => {
            const from = tx.from_address;
            const to = tx.to_address;
            const value = parseFloat(tx.value) || 0;

            if (!addressMap.has(from)) {
                addressMap.set(from, {
                    sendCount: 0,
                    receiveCount: 0,
                    sendValue: 0,
                    receiveValue: 0,
                });
            }
            if (!addressMap.has(to)) {
                addressMap.set(to, {
                    sendCount: 0,
                    receiveCount: 0,
                    sendValue: 0,
                    receiveValue: 0,
                });
            }

            const fromStats = addressMap.get(from)!;
            const toStats = addressMap.get(to)!;

            fromStats.sendCount++;
            fromStats.sendValue += value;
            toStats.receiveCount++;
            toStats.receiveValue += value;
        });

        const topSenders = Array.from(addressMap.entries())
            .map(([address, stats]) => ({
                address,
                count: stats.sendCount,
                totalValue: stats.sendValue.toFixed(18),
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        const topReceivers = Array.from(addressMap.entries())
            .map(([address, stats]) => ({
                address,
                count: stats.receiveCount,
                totalValue: stats.receiveValue.toFixed(18),
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        return {
            uniqueFromAddresses: new Set(
                transactions.map((tx) => tx.from_address)
            ).size,
            uniqueToAddresses: new Set(transactions.map((tx) => tx.to_address))
                .size,
            txTypeDistribution: transactions.reduce(
                (acc, tx) => {
                    const type = tx.transaction_type || "unknown";
                    acc[type] = (acc[type] || 0) + 1;
                    return acc;
                },
                {} as Record<string, number>
            ),
            addressStats: {
                topSenders,
                topReceivers,
            },
        };
    }

    private calculateGasStats(transactions: any[]) {
        const gasUsed = transactions.map((tx) =>
            parseInt(tx.receipt_gas_used || "0", 10)
        );
        const gasPrices = transactions.map((tx) =>
            parseInt(tx.gas_price || "0", 10)
        );

        const totalGasUsed = gasUsed.reduce((sum, gas) => sum + gas, 0);
        const totalGasCost = gasUsed.reduce(
            (sum, gas, i) => sum + gas * gasPrices[i],
            0
        );

        return {
            totalGasUsed,
            averageGasUsed: Math.floor(totalGasUsed / gasUsed.length) || 0,
            minGasUsed: Math.min(...gasUsed),
            maxGasUsed: Math.max(...gasUsed),
            averageGasPrice:
                Math.floor(
                    gasPrices.reduce((sum, price) => sum + price, 0) /
                        gasPrices.length
                ) || 0,
            totalGasCost: (totalGasCost / 1e18).toFixed(18),
        };
    }

    private calculateValueStats(transactions: any[]) {
        const values = transactions.map((tx) => parseFloat(tx.value || "0"));
        const zeroValueCount = values.filter((v) => v === 0).length;

        const totalValue = values.reduce((sum, val) => sum + val, 0);

        return {
            totalValue: totalValue.toFixed(18),
            averageValue: (totalValue / values.length).toFixed(18),
            minValue: Math.min(...values).toFixed(18),
            maxValue: Math.max(...values).toFixed(18),
            zeroValueCount,
        };
    }

    private calculateContractStats(transactions: any[]) {
        const contractTxs = transactions.filter(
            (tx) => tx.input && tx.input !== "0x"
        );
        const normalTxs = transactions.filter(
            (tx) => !tx.input || tx.input === "0x"
        );

        const contractAddresses = new Set(
            contractTxs.map((tx) => tx.to_address)
        );

        const contractCounts: Record<string, number> = {};
        contractTxs.forEach((tx) => {
            const addr = tx.to_address;
            contractCounts[addr] = (contractCounts[addr] || 0) + 1;
        });

        const topContracts = Object.entries(contractCounts)
            .map(([address, count]) => ({
                address,
                count: count as number,
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        return {
            contractStats: {
                contractTransactions: contractTxs.length,
                normalTransactions: normalTxs.length,
                contractInteractions: {
                    uniqueContracts: contractAddresses.size,
                    topContracts,
                },
            },
        };
    }
}

export const fetchTransactionAction: Action = {
    name: "fetch_transactions",
    description:
        "Fetch and analyze Ethereum transactions with comprehensive statistics",
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
        "today's transactions",
        "yesterday's transfers",
        "last week's transactions",
        "monthly transaction history",
        "transactions from last month",
        "address transactions",
        "wallet transfers",
        "account activity",
        "address history",
        "wallet history",
        "large transactions",
        "high value transfers",
        "transactions above",
        "transfers worth more than",
        "big eth movements",
        "contract interactions",
        "smart contract calls",
        "contract transactions",
        "dapp interactions",
        "protocol transactions",
        "recent large transfers",
        "recent large transfers",
        "high value contract calls",
        "address contract interactions",
        "wallet activity last week",
        "today's big transactions",
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
        [
            {
                user: "user",
                content: {
                    text: "Show me transactions from the last 24 hours",
                    action: "FETCH_TRANSACTIONS",
                },
            },
        ],
        [
            {
                user: "user",
                content: {
                    text: "Find all contract interactions for address 0x1234...",
                    action: "FETCH_TRANSACTIONS",
                },
            },
        ],
        [
            {
                user: "user",
                content: {
                    text: "Show large transactions (>10 ETH) from the last week",
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
                message,
                runtime,
                state
            );

            if (callback) {
                if (result) {
                    if (result.type === "analysis") {
                        callback({
                            text: result.result as string,
                        });
                    } else {
                        callback({
                            text: JSON.stringify(result.result, null, 2),
                        });
                    }
                } else {
                    callback({
                        text: "Query failed, please try again",
                    });
                }
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
