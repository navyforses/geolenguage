import { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

export default function usePlatformData(slug = null) {
  const [platforms, setPlatforms] = useState([]);
  const [platform, setPlatform] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all platforms
  const fetchPlatforms = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/platforms');
      setPlatforms(response.data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch single platform
  const fetchPlatform = useCallback(async (platformSlug) => {
    try {
      setLoading(true);
      const response = await api.get(`/platforms/${platformSlug}`);
      setPlatform(response.data);
      setError(null);
    } catch (err) {
      setError(err.message);
      setPlatform(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh platform data
  const refreshPlatform = useCallback(async (platformSlug) => {
    try {
      const response = await api.get(`/platforms/${platformSlug}/refresh`);
      return response.data;
    } catch (err) {
      throw err;
    }
  }, []);

  // Get platform metrics
  const getMetrics = useCallback(async (platformSlug, options = {}) => {
    try {
      const params = new URLSearchParams();
      if (options.from) params.append('from', options.from);
      if (options.to) params.append('to', options.to);
      if (options.type) params.append('type', options.type);

      const response = await api.get(`/platforms/${platformSlug}/metrics?${params}`);
      return response.data;
    } catch (err) {
      throw err;
    }
  }, []);

  // Get historical data
  const getHistorical = useCallback(async (platformSlug, days = 30, metricType = null) => {
    try {
      const params = new URLSearchParams();
      params.append('days', days);
      if (metricType) params.append('metric_type', metricType);

      const response = await api.get(`/platforms/${platformSlug}/historical?${params}`);
      return response.data;
    } catch (err) {
      throw err;
    }
  }, []);

  // Compare platforms
  const comparePlatforms = useCallback(async (slugs, metrics = []) => {
    try {
      const response = await api.post('/platforms/compare', { slugs, metrics });
      return response.data;
    } catch (err) {
      throw err;
    }
  }, []);

  useEffect(() => {
    if (slug) {
      fetchPlatform(slug);
    } else {
      fetchPlatforms();
    }
  }, [slug, fetchPlatform, fetchPlatforms]);

  return {
    platforms,
    platform,
    loading,
    error,
    fetchPlatforms,
    fetchPlatform,
    refreshPlatform,
    getMetrics,
    getHistorical,
    comparePlatforms
  };
}
