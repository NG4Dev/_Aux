/**
 * Creates a new transaction object.
 * In a real app, this would call your backend API.
 * Persistence (MMKV) is handled by the store layer; this function just constructs and returns the transaction payload.
 */
// Import the Transaction type and any error interface for potential future use
import { Transaction, TransactionError } from '@/features/wallet/types';

/**
 * Creates a new transaction object:
 * 1. Locally constructs a pending transaction with a unique ID and timestamp.
 * 2. (Stub) Placeholder for actual API call to persist transaction on the backend.
 *
 * @param tx - Partial transaction data (excludes id, status, and date)
 * @returns A full Transaction object ready for store persistence
 */
export async function createTransaction(
  tx: Omit<Transaction, 'id' | 'status' | 'date'>
): Promise<Transaction> {
  // 1. Construct the transaction locally with pending status
  const newTx: Transaction = {
    ...tx,                           // Spread in type, amount, title
    id: String(Date.now()),         // Use timestamp as unique ID
    status: 'pending',              // Mark as pending until confirmed by backend
    date: new Date(),               // Set current timestamp
  };

  // 2. Placeholder for real backend integration:
  //    You would typically send `tx` to your API and receive the saved transaction
  //    const response = await api.post('/transactions', tx);
  //    return response.data;

  // 3. Return the locally constructed transaction for store update
  // TODO: replace this stub with an API call, e.g.: 
  // const response = await api.post('/transactions', tx);
  // return response.data
  return newTx;
}
