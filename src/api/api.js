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

// get asset historical data via backtest endpoint (POST) -> returns resp.data
export async function getAssetHistory(ticker, startDate = null, endDate = null) {
  // Usa l'endpoint backtest per ottenere i dati storici di un singolo asset
  const payload = {
    assets: [{ ticker, weight: 1.0, entry_fee_percent: 0, annual_fee_percent: 0 }],
    initial_investment: 10000,
    annual_contribution: 0,
    contribution_frequency: 'none',
    start_date: startDate || '2015-01-01',
    end_date: endDate || new Date().toISOString().split('T')[0],
    optimization_target: ''
  };
  
  const resp = await axiosInstance.post('/backtest', payload);
  return resp.data;
}