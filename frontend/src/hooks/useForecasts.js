import { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

export default function useForecasts(platformSlug = null) {
  const [forecasts, setForecasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch forecasts
  const fetchForecasts = useCallback(async (options = {}) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (options.type) params.append('type', options.type);
      if (options.horizon) params.append('horizon', options.horizon);

      const response = await api.get(`/forecasts?${params}`);
      setForecasts(response.data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch forecasts for a platform
  const fetchPlatformForecasts = useCallback(async (slug) => {
    try {
      setLoading(true);
      const response = await api.get(`/forecasts/platform/${slug}`);
      setForecasts(response.data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Generate new forecast
  const generateForecast = useCallback(async (slug, force = false) => {
    try {
      const response = await api.post('/forecasts/generate', {
        platform_slug: slug,
        force
      });
      return response.data;
    } catch (err) {
      throw err;
    }
  }, []);

  // Get forecast by ID
  const getForecast = useCallback(async (id) => {
    try {
      const response = await api.get(`/forecasts/${id}`);
      return response.data;
    } catch (err) {
      throw err;
    }
  }, []);

  // Get forecasts summary
  const getSummary = useCallback(async () => {
    try {
      const response = await api.get('/forecasts/stats/summary');
      return response.data;
    } catch (err) {
      throw err;
    }
  }, []);

  // Get accuracy stats
  const getAccuracy = useCallback(async (options = {}) => {
    try {
      const params = new URLSearchParams();
      if (options.platformId) params.append('platform_id', options.platformId);
      if (options.days) params.append('days', options.days);

      const response = await api.get(`/forecasts/stats/accuracy?${params}`);
      return response.data;
    } catch (err) {
      throw err;
    }
  }, []);

  useEffect(() => {
    if (platformSlug) {
      fetchPlatformForecasts(platformSlug);
    } else {
      fetchForecasts();
    }
  }, [platformSlug, fetchForecasts, fetchPlatformForecasts]);

  return {
    forecasts,
    loading,
    error,
    fetchForecasts,
    fetchPlatformForecasts,
    generateForecast,
    getForecast,
    getSummary,
    getAccuracy
  };
}
