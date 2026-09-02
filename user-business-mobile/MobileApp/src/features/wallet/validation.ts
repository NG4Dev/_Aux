import { Transaction } from './types';

/** Validates that a withdrawal amount does not exceed the available balance */
export function validateWithdrawal(amount: number, balance: number): boolean {
  if (amount <= 0) return false;
  return amount <= balance;
}

/** Validates that a deposit amount is positive */
export function validateDeposit(amount: number): boolean {
  return amount > 0;
}