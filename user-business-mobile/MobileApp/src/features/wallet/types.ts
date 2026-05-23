export interface Transaction {
    id: string;
    amount: number;
    date: Date;
    title: string;
    status: 'pending' | 'completed' | 'failed';
    type: 'deposit' | 'withdrawal';
  }
  
  export interface TransactionError {
    code: string;
    message: string;
  }