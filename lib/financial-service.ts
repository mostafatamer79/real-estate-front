import api from './api';

export enum TransactionType {
  SALE = 'sale',
  RENT = 'rent',
  COMMISSION = 'commission',
  TAX = 'tax',
  DEPOSIT = 'deposit',
  WITHDRAWAL = 'withdrawal',
  SETTLEMENT = 'settlement',
  EXPENSE = 'expense',
}

export enum TransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum PaymentMethod {
  BANK = 'bank',
  CARD = 'card',
  APPLE_PAY = 'apple_pay',
  WALLET = 'wallet',
  CASH = 'cash',
}

export interface FinancialTransaction {
  id: string;
  type: TransactionType;
  amount: number;
  fromUserId: string;
  toUserId: string;
  taxAmount: number;
  commissionAmount: number;
  status: TransactionStatus;
  paymentMethod?: PaymentMethod;
  expenseCategory?: string;
  commissionBreakdown?: any;
  referenceType?: string;
  referenceId?: string;
  description?: string;
  transactionDate: string;
  updatedAt: string;
}

export interface CreateTransactionDto {
  type: TransactionType;
  amount: number;
  fromUserId?: string;
  toUserId?: string;
  taxAmount?: number;
  commissionAmount?: number;
  status?: TransactionStatus;
  paymentMethod?: PaymentMethod;
  expenseCategory?: string;
  commissionBreakdown?: any;
  referenceType?: string;
  referenceId?: string;
  description?: string;
}

export interface WalletData {
  balance: number;
  transactions: FinancialTransaction[];
}

export const financialApi = {
  // Create a new transaction
  createTransaction: async (data: CreateTransactionDto): Promise<FinancialTransaction> => {
    const response = await api.post('/financial/transaction', data);
    return response.data;
  },

  // Create an expense
  createExpense: async (data: CreateTransactionDto): Promise<FinancialTransaction> => {
    const response = await api.post('/financial/expense', data);
    return response.data;
  },

  // Request withdrawal
  requestWithdrawal: async (amount: number): Promise<FinancialTransaction> => {
    const response = await api.post('/financial/withdraw', { amount });
    return response.data;
  },

  // Get dashboard statistics
  getDashboardStats: async (): Promise<any> => {
    const response = await api.get('/financial/dashboard');
    return response.data;
  },

  // Get all transactions
  getAllTransactions: async (): Promise<FinancialTransaction[]> => {
    const response = await api.get('/financial/transactions');
    return response.data;
  },

  // Get commissions
  getCommissions: async (): Promise<FinancialTransaction[]> => {
      const response = await api.get('/financial/commissions');
      return response.data;
  },

  // Get current user's wallet
  getMyWallet: async (): Promise<WalletData> => {
    const response = await api.get('/financial/my-wallet');
    return response.data;
  }
};
