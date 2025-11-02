import axios from 'axios';

const BASE_URL = 'https://backtest-server-final-453907803757.europe-west3.run.app/api';

export const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 60000,
});

// search tickers (GET)
export async function searchTickers(q) {
  const resp = await axiosInstance.get(`/search_tickers?q=${encodeURIComponent(q)}`);
  return resp.data;
}

// post backtest (POST) -> returns resp.data
export async function postBacktest(payload) {
  const resp = await axiosInstance.post('/backtest', payload);
  return resp.data;
}

// post efficient frontier (POST) -> returns resp.data
export async function postEfficientFrontier(payload) {
  const resp = await axiosInstance.post('/efficient_frontier', payload);
  return resp.data;
}