export const fetchTransactionTemplate = `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.

Example response:
\`\`\`json
{
    "address": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
    "startDate": "2024-01-01",
    "endDate": "2024-03-01",
    "minValue": "1.5",
    "maxValue": null,
    "limit": 10,
    "orderBy": "block_timestamp",
    "orderDirection": "DESC"
}
\`\`\`

{{recentMessages}}

Given the recent messages, extract the following information about the transaction query:
- Wallet address to query (if any)
- Start date (YYYY-MM-DD format)
- End date (YYYY-MM-DD format)
- Minimum value in ETH (if any)
- Maximum value in ETH (if any)
- Number of transactions to return (default 10, max 100)
- Order by field (block_timestamp, value, or gas_price)
- Order direction (ASC or DESC)

Respond with a JSON markdown block containing only the extracted values.`;
