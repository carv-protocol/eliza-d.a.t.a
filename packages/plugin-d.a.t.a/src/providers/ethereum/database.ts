import {
    Provider,
    IAgentRuntime,
    Memory,
    State,
    elizaLogger,
    embed,
    trimTokens,
} from "@elizaos/core";

export const queryResolutionTemplate = `#
Database Schema
CREATE EXTERNAL TABLE blocks(
  timestamp timestamp,
  number bigint,
  hash string,
  parent_hash string,
  nonce string,
  sha3_uncles string,
  logs_bloom string,
  transactions_root string,
  state_root string,
  receipts_root string,
  miner string,
  difficulty double,
  total_difficulty double,
  size bigint,
  extra_data string,
  gas_limit bigint,
  gas_used bigint,
  transaction_count bigint,
  base_fee_per_gas bigint)
PARTITIONED BY (
  date string)
ROW FORMAT SERDE
  'org.apache.hadoop.hive.ql.io.parquet.serde.ParquetHiveSerDe'
STORED AS INPUTFORMAT
  'org.apache.hadoop.hive.ql.io.parquet.MapredParquetInputFormat'
OUTPUTFORMAT
  'org.apache.hadoop.hive.ql.io.parquet.MapredParquetOutputFormat'
TBLPROPERTIES (
);
CREATE EXTERNAL TABLE contracts(
  address string,
  bytecode string,
  block_timestamp timestamp,
  block_number bigint,
  block_hash string)
PARTITIONED BY (
  date string)
ROW FORMAT SERDE
  'org.apache.hadoop.hive.ql.io.parquet.serde.ParquetHiveSerDe'
STORED AS INPUTFORMAT
  'org.apache.hadoop.hive.ql.io.parquet.MapredParquetInputFormat'
OUTPUTFORMAT
  'org.apache.hadoop.hive.ql.io.parquet.MapredParquetOutputFormat'
TBLPROPERTIES (
);
CREATE EXTERNAL TABLE logs(
  log_index bigint,
  transaction_hash string,
  transaction_index bigint,
  address string,
  data string,
  topics array<string>,
  block_timestamp timestamp,
  block_number bigint,
  block_hash string)
PARTITIONED BY (
  date string)
ROW FORMAT SERDE
  'org.apache.hadoop.hive.ql.io.parquet.serde.ParquetHiveSerDe'
STORED AS INPUTFORMAT
  'org.apache.hadoop.hive.ql.io.parquet.MapredParquetInputFormat'
OUTPUTFORMAT
  'org.apache.hadoop.hive.ql.io.parquet.MapredParquetOutputFormat'
TBLPROPERTIES (
);
CREATE EXTERNAL TABLE token_transfers(
  token_address string,
  from_address string,
  to_address string,
  value double,
  transaction_hash string,
  log_index bigint,
  block_timestamp timestamp,
  block_number bigint,
  block_hash string)
PARTITIONED BY (
  date string)
ROW FORMAT SERDE
  'org.apache.hadoop.hive.ql.io.parquet.serde.ParquetHiveSerDe'
STORED AS INPUTFORMAT
  'org.apache.hadoop.hive.ql.io.parquet.MapredParquetInputFormat'
OUTPUTFORMAT
  'org.apache.hadoop.hive.ql.io.parquet.MapredParquetOutputFormat'
LOCATION
  's3://aws-public-blockchain/v1.0/eth/token_transfers'
TBLPROPERTIES (
);
CREATE EXTERNAL TABLE traces(
  transaction_hash string,
  transaction_index bigint,
  from_address string,
  to_address string,
  value double,
  input string,
  output string,
  trace_type string,
  call_type string,
  reward_type string,
  gas double,
  gas_used double,
  subtraces bigint,
  trace_address string,
  error string,
  status bigint,
  block_timestamp timestamp,
  block_number bigint,
  block_hash string,
  trace_id string)
PARTITIONED BY (
  date string)
ROW FORMAT SERDE
  'org.apache.hadoop.hive.ql.io.parquet.serde.ParquetHiveSerDe'
STORED AS INPUTFORMAT
  'org.apache.hadoop.hive.ql.io.parquet.MapredParquetInputFormat'
OUTPUTFORMAT
  'org.apache.hadoop.hive.ql.io.parquet.MapredParquetOutputFormat'
LOCATION
  's3://aws-public-blockchain/v1.0/eth/traces'
TBLPROPERTIES (
);
CREATE EXTERNAL TABLE transactions(
  hash string,
  nonce bigint,
  transaction_index bigint,
  from_address string,
  to_address string,
  value double,
  gas bigint,
  gas_price bigint,
  input string,
  receipt_cumulative_gas_used bigint,
  receipt_gas_used bigint,
  receipt_contract_address string,
  receipt_root string,
  receipt_status bigint,
  block_timestamp timestamp,
  block_number bigint,
  block_hash string,
  max_fee_per_gas bigint,
  max_priority_fee_per_gas bigint,
  transaction_type bigint,
  receipt_effective_gas_price bigint)
PARTITIONED BY (
  date string)
ROW FORMAT SERDE
  'org.apache.hadoop.hive.ql.io.parquet.serde.ParquetHiveSerDe'
STORED AS INPUTFORMAT
  'org.apache.hadoop.hive.ql.io.parquet.MapredParquetInputFormat'
OUTPUTFORMAT
  'org.apache.hadoop.hive.ql.io.parquet.MapredParquetOutputFormat'
LOCATION
  's3://aws-public-blockchain/v1.0/eth/transactions'
TBLPROPERTIES (
);

# Query Examples
Example 1:
SELECT COUNT(*) AS token_transfers
FROM eth.token_transfers
WHERE block_timestamp >= TIMESTAMP '2024-05-20'
AND block_timestamp < TIMESTAMP '2024-05-21'
AND lower(token_address) = lower('0x514910771AF9Ca656af840dff83E8264EcF986CA');

Example 2:
SELECT * FROM eth.blocks WHERE date='2024-03-11';

Example 3:
SELECT date, SUM(gas_used) AS total_gas_used
FROM eth.blocks
GROUP BY date
ORDER BY date DESC;

Example 4:
SELECT hash, value
FROM eth.transactions
WHERE block_timestamp >= TIMESTAMP '2024-05-16'
AND block_timestamp < TIMESTAMP '2024-05-17'
ORDER BY value DESC
LIMIT 1;

# User's Query
{{userQuery}}

# Instructions:
1. **Determine if a Query is Needed**:
   - Analyze the user's query to decide if it requires retrieving data or if it can be answered directly without a query.
   - If no query is needed, return a response with a message explaining why (e.g., "The query does not request any specific data.").
2. **Determine the Query Objective**:
   - If a query is needed, identify the goal (e.g., "Count transactions", "Fetch gas usage", etc.).
   - Extract specific filters or conditions, such as time ranges, addresses, or other parameters, from the user's query.
3. **Identify the Blockchain Network**:
   - If the user specifies a network, resolve it.
   - If the network is not specified, default to "Ethereum".
   - If the network is not "Ethereum", generate a response indicating that only Ethereum is supported.
4. **Generate SQL Queries**:
   - Use the provided schema and query examples to structure SQL queries that meet the user's objective.
   - Ensure the SQL queries align with the schema's fields and structure.
   - If the query requires multiple SQL queries, generate all necessary queries and explain how the results should be combined.
5. **Generate Other Data Source Instructions**:
   - If applicable, include instructions for metrics, external APIs, or vector searches.
6. **Format the Output**:
   - Return a JSON response with the following fields:
     - 'status': A string that indicates success or failure.
     - 'network': The resolved blockchain network.
     - 'dataSources': A list of queries or instructions, each with:
       - 'type': The type of query (e.g., "sql", "metrics", "unsupported_network").
       - 'data': The query or instruction to execute.
       - 'resultFormat': A string that specifies how the result should be formatted, including the network.

# Response Format:
\`\`\`json
{
  "status": "success",
  "network": "{{resolvedNetwork}}",
  "dataSources": [
    {
      "type": "{{queryType}}",
      "data": "{{queryOrMessage}}",
      "resultFormat": "{{label}} ({{network}}): {{result}}"
    }
  ]
}
\`\`\`

# Examples:
## Example 1: User Query Requiring Two SQL Queries
User Query: "What is the total gas used yesterday, and how many transactions happened yesterday?"

Parsed Query Objective: "Fetch the total gas used in Ethereum blocks yesterday and count the total number of transactions yesterday."

Response:
\`\`\`json
{
  "status": "success",
  "network": "Ethereum",
  "dataSources": [
    {
      "type": "sql",
      "data": "SELECT SUM(gas_used) AS total_gas_used FROM eth.blocks WHERE block_timestamp >= TIMESTAMP '2024-12-01 00:00:00' AND block_timestamp < TIMESTAMP '2024-12-02 00:00:00';",
      "resultFormat": "total_gas_used (Ethereum): {{result}}"
    },
    {
      "type": "sql",
      "data": "SELECT COUNT(*) AS transaction_count FROM eth.transactions WHERE block_timestamp >= TIMESTAMP '2024-12-01 00:00:00' AND block_timestamp < TIMESTAMP '2024-12-02 00:00:00';",
      "resultFormat": "transaction_count (Ethereum): {{result}}"
    }
  ]
}
\`\`\`

## Example 2: User Query with No Query Needed
User Query: "Can Ethereum transactions be tracked?"

Parsed Query Objective: "Answer whether Ethereum transactions can be tracked."

Response:
\`\`\`json
{
  "status": "success",
  "network": "Ethereum",
  "dataSources": [
    {
      "type": "no_query_needed",
      "data": "Yes, Ethereum transactions can be tracked using the blockchain.",
      "resultFormat": "response_message (Ethereum): {{result}}"
    }
  ]
}
\`\`\`

## Example 3: User Query with Unsupported Network
User Query: "How many transactions on Binance Smart Chain yesterday?"

Parsed Query Objective: "Count the total number of transactions on Binance Smart Chain for the previous day."

Response:
\`\`\`json
{
  "status": "success",
  "network": "Binance Smart Chain",
  "dataSources": [
    {
      "type": "unsupported_network",
      "data": "Only Ethereum is supported.",
      "resultFormat": "error_message (Binance Smart Chain): {{result}}"
    }
  ]
}
\`\`\`
`;

const databaseSchema = `
CREATE EXTERNAL TABLE \`blocks\`(
  \`timestamp\` timestamp,
  \`number\` bigint,
  \`hash\` string,
  ...
) PARTITIONED BY ( \`date\` string) ...;
CREATE EXTERNAL TABLE \`transactions\`(
  \`hash\` string,
  \`nonce\` bigint,
  ...
) PARTITIONED BY ( \`date\` string) ...;
`;

const queryExamples = `
Example 1:
SELECT COUNT(*) AS token_transfers
FROM eth.token_transfers
WHERE block_timestamp >= TIMESTAMP '2024-05-20'
AND block_timestamp < TIMESTAMP '2024-05-21'
AND lower(token_address) = lower('0x514910771AF9Ca656af840dff83E8264EcF986CA');

Example 2:
SELECT * FROM eth.blocks WHERE date='2024-03-11';

Example 3:
SELECT date, SUM(gas_used) AS total_gas_used
FROM eth.blocks
GROUP BY date
ORDER BY date DESC;

Example 4:
SELECT hash, value
FROM eth.transactions
WHERE block_timestamp >= timestamp '2024-05-16'
AND block_timestamp < timestamp '2024-05-17'
ORDER BY value DESC
LIMIT 1;
`;

// Inject schema and examples into the template
const prompt = queryResolutionTemplate
    .replace("{{databaseSchema}}", databaseSchema)
    .replace("{{queryExamples}}", queryExamples)
    .replace("{{userQuery}}", userQuery);

export class EthProvider implements Provider {
    constructor() {}
    async get(
        runtime: IAgentRuntime,
        message: Memory,
        state: State
    ): Promise<string | null> {
        // Data retrieval logic for the provider
        const blockchainDataRuntimeManager = runtime.getMemoryManager(
            this.blockchainDataTableName
        );
        elizaLogger.log(
            "Retrieving onchain eth txs from blockchain data runtime manager..."
        );

        const embedding = await embed(runtime, message.content.text);
        const memories =
            await blockchainDataRuntimeManager.searchMemoriesByEmbedding(
                embedding,
                {
                    roomId: message.agentId,
                    count: relativeTxsCount,
                    match_threshold: 0.1,
                }
            );
        return concatenateMemories(memories);
    }
}

function concatenateMemories(memories: Memory[]): string {
    const prefix = "A list of relevant on-chain ethereum txs content: ";
    const concatenatedContent = memories
        .map((memory) => memory.content.text)
        .join(" ");
    return prefix + concatenatedContent;
}

const relativeTxsCount = 100;

export class EthTxsProvider implements Provider {
    constructor(private blockchainDataTableName: string) {}
    async get(
        runtime: IAgentRuntime,
        message: Memory,
        state: State
    ): Promise<string | null> {
        // Data retrieval logic for the provider
        const blockchainDataRuntimeManager = runtime.getMemoryManager(
            this.blockchainDataTableName
        );
        elizaLogger.log(
            "Retrieving onchain eth txs from blockchain data runtime manager..."
        );

        const embedding = await embed(runtime, message.content.text);
        const memories =
            await blockchainDataRuntimeManager.searchMemoriesByEmbedding(
                embedding,
                {
                    roomId: message.agentId,
                    count: relativeTxsCount,
                    match_threshold: 0.1,
                }
            );
        return concatenateMemories(memories);
    }
}
