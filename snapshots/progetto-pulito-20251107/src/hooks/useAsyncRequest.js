import { useRef, useEffect, useState, useCallback } from 'react';

/**
 * useAsyncRequest - simple hook to run async functions safely with cancellation support
 * - fn: async function that receives an AbortSignal as first param (optional)
 * - deps: dependency array
 *
 * returns: { run, loading, error, data }
 */
export default function useAsyncRequest(fn, deps = []) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const controllerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (controllerRef.current) {
        try { controllerRef.current.abort(); } catch (e) {}
      }
    };
  }, []);

  const run = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    const controller = new AbortController();
    controllerRef.current = controller;
    try {
      const result = await fn(controller.signal, ...args);
      setData(result);
      return result;
    } catch (err) {
      if (err?.name === 'CanceledError' || err?.name === 'AbortError') {
        // aborted — ignore
      } else {
        setError(err);
        throw err;
      }
    } finally {
      setLoading(false);
    }
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  return { run, loading, error, data, abort: () => controllerRef.current?.abort?.() };
}