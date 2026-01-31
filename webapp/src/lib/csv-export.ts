import type { Transaction, AwakensCSVRow } from './types';
import { getChainById } from './chains';

// Convert transactions to Awakens CSV format
export function transactionsToAwakensFormat(
  transactions: Transaction[],
  walletAddress: string
): AwakensCSVRow[] {
  return transactions.map(tx => {
    const chain = getChainById(tx.chainId);
    const isOutgoing = tx.from.toLowerCase() === walletAddress.toLowerCase();
    const isIncoming = tx.to.toLowerCase() === walletAddress.toLowerCase();

    // Determine transaction type for Awakens
    let type: string;
    switch (tx.type) {
      case 'transfer':
        type = isOutgoing ? 'Send' : 'Receive';
        break;
      case 'swap':
        type = 'Trade';
        break;
      case 'stake':
        type = 'Stake';
        break;
      case 'unstake':
        type = 'Unstake';
        break;
      case 'reward':
        type = 'Staking Reward';
        break;
      case 'contract':
        type = 'Contract Interaction';
        break;
      case 'token':
        type = isOutgoing ? 'Send' : 'Receive';
        break;
      case 'nft':
        type = isOutgoing ? 'NFT Send' : 'NFT Receive';
        break;
      default:
        type = 'Other';
    }

    // Format date as YYYY-MM-DD HH:mm:ss
    const date = new Date(parseInt(tx.timestamp) * 1000);
    const formattedDate = date.toISOString().replace('T', ' ').substring(0, 19);

    // Calculate sent/received based on direction
    let sentCurrency = '';
    let sentAmount = '';
    let receivedCurrency = '';
    let receivedAmount = '';

    if (isOutgoing) {
      sentCurrency = tx.tokenSymbol || tx.symbol;
      sentAmount = tx.tokenAmount || tx.valueFormatted;
    }

    if (isIncoming) {
      receivedCurrency = tx.tokenSymbol || tx.symbol;
      receivedAmount = tx.tokenAmount || tx.valueFormatted;
    }

    // For swaps, we might have both
    if (tx.type === 'swap') {
      // This is simplified - real swap parsing would need more data
      sentCurrency = tx.symbol;
      sentAmount = tx.valueFormatted;
      receivedCurrency = tx.tokenSymbol || 'UNKNOWN';
      receivedAmount = tx.tokenAmount || '0';
    }

    // Build description
    let description = '';
    if (tx.method) {
      description = tx.method;
    } else if (tx.type === 'transfer') {
      description = isOutgoing
        ? `Sent to ${tx.to.substring(0, 10)}...`
        : `Received from ${tx.from.substring(0, 10)}...`;
    } else {
      description = tx.type.charAt(0).toUpperCase() + tx.type.slice(1);
    }

    return {
      Date: formattedDate,
      Type: type,
      'Sent Currency': sentCurrency,
      'Sent Amount': sentAmount,
      'Sent Cost Basis': '', // User needs to fill this
      'Received Currency': receivedCurrency,
      'Received Amount': receivedAmount,
      'Received Cost Basis': '', // User needs to fill this
      'Fee Currency': tx.symbol,
      'Fee Amount': tx.feeFormatted,
      Description: description,
      TxHash: tx.hash,
      Blockchain: chain?.name || tx.chainName,
      'Wallet Address': walletAddress,
    };
  });
}

// Generate CSV string from Awakens format
export function generateCSV(rows: AwakensCSVRow[]): string {
  if (rows.length === 0) return '';

  const headers = Object.keys(rows[0]) as (keyof AwakensCSVRow)[];
  const csvRows: string[] = [];

  // Add header row
  csvRows.push(headers.map(h => `"${h}"`).join(','));

  // Add data rows
  for (const row of rows) {
    const values = headers.map(header => {
      const value = row[header];
      // Escape quotes and wrap in quotes
      return `"${String(value).replace(/"/g, '""')}"`;
    });
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
}

// Download CSV file
export function downloadCSV(
  transactions: Transaction[],
  walletAddress: string,
  chainName: string
): void {
  const awakensRows = transactionsToAwakensFormat(transactions, walletAddress);
  const csvContent = generateCSV(awakensRows);

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  const filename = `chainlens_${chainName}_${walletAddress.substring(0, 8)}_${new Date().toISOString().split('T')[0]}.csv`;

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Download all transactions from multiple chains
export function downloadAllCSV(
  transactionsByChain: Map<string, Transaction[]>,
  walletAddress: string
): void {
  const allRows: AwakensCSVRow[] = [];

  transactionsByChain.forEach((transactions) => {
    const rows = transactionsToAwakensFormat(transactions, walletAddress);
    allRows.push(...rows);
  });

  // Sort by date descending
  allRows.sort((a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime());

  const csvContent = generateCSV(allRows);

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  const filename = `chainlens_all_chains_${walletAddress.substring(0, 8)}_${new Date().toISOString().split('T')[0]}.csv`;

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
