import axios from 'axios';

const BASE_URL = 'https://backtest-server-final-453907803757.europe-west3.run.app/api'; // change if needed

export const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// simple wrappers
export async function searchTickers(q, signal) {
  if (!q || q.length < 1) return [];
  const res = await axiosInstance.get(`/search_tickers?q=${encodeURIComponent(q)}`, { signal });
  return res.data || [];
}

export async function postBacktest(payload) {
  const res = await axiosInstance.post('/backtest', payload);
  return res.data;
}

export async function postEfficientFrontier(payload) {
  const res = await axiosInstance.post('/efficient_frontier', payload);
  return res.data;
}