// Zustand and middleware imports for state management and persistence
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from './mmkv-storage';

// Wallet logic imports: validation functions and transaction creator
import { validateDeposit, validateWithdrawal } from '@/features/wallet/validation';
import { createTransaction } from '@/features/wallet/transactions';
import { Transaction } from '@/features/wallet/types';

// Define the shape of our balance store state and actions
interface BalanceState {
  balance: number; // Current user balance
  transactions: Transaction[]; // List of past transactions
  loading: boolean; // Flag: is a transaction in progress?
  error: string | null; // Any error message from last operation

  // Action to run a deposit or withdrawal
  runTransaction: (type: 'deposit' | 'withdrawal', amount: number) => Promise<void>;
}

// Create the store with persistence
export const useBalanceStore = create<BalanceState>()(
  persist(
    (set, get) => ({
      // Initial state values
      balance: 0,
      transactions: [],
      loading: false,
      error: null,

      /**
       * runTransaction: Handles both deposit and withdrawal flows
       * - Validates the amount (deposit must be >0, withdrawal must not exceed balance)
       * - Sets loading = true to disable UI during processing
       * - Constructs a pending transaction via createTransaction()
       * - Updates balance and transaction list on success
       * - Catches and stores any errors
       */
      async runTransaction(type, amount) {
        const { balance, transactions } = get();

        // 1. Validate amount against business rules
        const isValid =
          type === 'deposit'
            ? validateDeposit(amount)
            : validateWithdrawal(amount, balance);

        if (!isValid) {
          // Invalid input: set error and abort
          set({ error: 'Invalid amount' });
          return;
        }

        // 2. Begin transaction: clear previous errors and show loading
        set({ loading: true, error: null });

        try {
          // 3. Create transaction object (stub or API call)
          const tx = await createTransaction({ type, amount, title: type });

          // 4. On success: append transaction & update balance
          set({
            transactions: [...transactions, tx],
            balance: type === 'deposit' ? balance + amount : balance - amount,
          });
        } catch (e: any) {
          // 5. On failure: capture error message
          set({ error: e.message || 'Transaction failed' });
        } finally {
          // 6. Always turn off loading indicator
          set({ loading: false });
        }
      },
    }),
    {
      // Persist the entire store under key 'balance' using MMKV
      name: 'balance',
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);