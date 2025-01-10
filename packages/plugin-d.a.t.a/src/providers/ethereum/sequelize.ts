import {
    Provider,
    IAgentRuntime,
    Memory,
    State,
    elizaLogger,
} from "@elizaos/core";

export class TxProvider {
    chain: string;
    constructor(chain: string) {
        this.chain = chain;
    }

    getSequelizeUrl(): string {
        return `https://${this.chain}.sequelize.com`;
    }

    getDataSchema(): string {
        return `
        Ethereum Transaction Data Schema:
        - hash: string (unique transaction hash)
        - blockNumber: number (block containing the transaction)
        - timestamp: datetime (transaction timestamp)
        - from: string (sender address)
        - to: string (recipient address)
        - value: string (transaction amount in wei)
        - gasUsed: string (gas consumed)
        - status: boolean (transaction success)

        Common Query Patterns:
        1. Get transactions by address:
           - Filter by from/to address
           - Time range optional
           - Pagination support

        2. Get transactions by block:
           - Filter by block number/range
           - Support for latest blocks

        3. Get transaction details:
           - Lookup by transaction hash
           - Returns full transaction data

        Query Parameters:
        - address: Ethereum address (0x...)
        - startBlock: number
        - endBlock: number
        - startTime: ISO datetime
        - endTime: ISO datetime
        - limit: number (default 100)
        - offset: number (default 0)

        Response Format:
        {
          transactions: [{
            hash: string,
            blockNumber: number,
            timestamp: string,
            from: string,
            to: string,
            value: string,
            gasUsed: string,
            status: boolean
          }],
          pagination: {
            total: number,
            limit: number,
            offset: number
          }
        }

        Error Handling:
        - Invalid address format
        - Block number out of range
        - Invalid time range
        - Rate limiting considerations
        `;
    }
}

export const txsSequelizeProvider = (runtime: IAgentRuntime) => {
    const chain = "ethereum-mainnet";
    return new TxProvider(chain);
};

export const sequelizeProvider: Provider = {
    get: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State
    ): Promise<string | null> => {
        elizaLogger.log("==== pis Retrieving from d.a.t.a provider...");
        try {
            const txsProvider = txsSequelizeProvider(runtime);
            const url = txsProvider.getSequelizeUrl();
            const schema = txsProvider.getDataSchema();

            elizaLogger.log("==== pis url: ", url);

            // Return context information for AI to understand the data structure and query patterns
            return `
            Ethereum Mainnet Transaction Database Context:

            Database URL: ${url}

            ${schema}

            Usage Notes:
            1. Always validate input parameters before querying
            2. Consider using pagination for large result sets
            3. Include error handling for failed queries
            4. Cache frequently accessed data when possible
            5. Monitor rate limits and query performance

            This database provides access to all Ethereum mainnet transactions with standardized query patterns and response formats.
            `;
        } catch (error) {
            elizaLogger.error("Error in d.a.t.a provider:", error);
            return null;
        }
    },
};
