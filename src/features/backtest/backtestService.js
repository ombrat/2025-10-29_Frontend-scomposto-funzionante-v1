import { axiosInstance } from '../../api/api';

/**
 * Small service wrapper for backtest-related API calls.
 * Keeping this separate allows future retry/caching logic.
 */

export async function runBacktest(payload) {
  const res = await axiosInstance.post('/backtest', payload);
  return res.data;
}

export async function runStaticBacktest(payload) {
  // alias / wrapper if you want different endpoint semantics
  const res = await axiosInstance.post('/backtest', payload);
  return res.data;
}

export async function simulatePortfolio(payload) {
  // payload structure same as runBacktest; used to simulate a portfolio from frontier
  const res = await axiosInstance.post('/backtest', payload);
  return res.data;
}