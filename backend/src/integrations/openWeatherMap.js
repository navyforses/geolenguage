/**
 * OpenWeatherMap API Integration
 * Free: 1,000 calls/day
 */

const axios = require('axios');
const logger = require('../utils/logger');

const BASE_URL = 'https://api.openweathermap.org/data/2.5';
const API_KEY = process.env.OPENWEATHER_KEY || '';

/**
 * Get current weather by city
 */
async function getCurrentWeather(city) {
    if (!API_KEY) {
        logger.warn('OpenWeatherMap API key not configured');
        return null;
    }

    try {
        const response = await axios.get(`${BASE_URL}/weather`, {
            params: {
                q: city,
                appid: API_KEY,
                units: 'metric'
            }
        });

        const data = response.data;
        return {
            city: data.name,
            country: data.sys.country,
            temperature: data.main.temp,
            feelsLike: data.main.feels_like,
            humidity: data.main.humidity,
            pressure: data.main.pressure,
            windSpeed: data.wind.speed,
            description: data.weather[0]?.description,
            icon: data.weather[0]?.icon,
            visibility: data.visibility,
            clouds: data.clouds.all,
            sunrise: new Date(data.sys.sunrise * 1000).toISOString(),
            sunset: new Date(data.sys.sunset * 1000).toISOString()
        };
    } catch (error) {
        logger.error('OpenWeatherMap error:', error.message);
        return null;
    }
}

/**
 * Get 5-day forecast
 */
async function getForecast(city) {
    if (!API_KEY) return [];

    try {
        const response = await axios.get(`${BASE_URL}/forecast`, {
            params: {
                q: city,
                appid: API_KEY,
                units: 'metric'
            }
        });

        return response.data.list.map(item => ({
            datetime: item.dt_txt,
            temperature: item.main.temp,
            feelsLike: item.main.feels_like,
            humidity: item.main.humidity,
            description: item.weather[0]?.description,
            windSpeed: item.wind.speed,
            pop: item.pop // Probability of precipitation
        }));
    } catch (error) {
        logger.error('OpenWeatherMap forecast error:', error.message);
        return [];
    }
}

/**
 * Fetch weather data
 */
async function fetch() {
    if (!API_KEY) return [];

    const results = [];
    const cities = ['San Francisco', 'Seattle', 'New York'];

    for (const city of cities) {
        try {
            const weather = await getCurrentWeather(city);
            if (weather) {
                results.push({
                    platformId: 'weather',
                    metricType: `owm_${city.toLowerCase().replace(' ', '_')}`,
                    value: weather.temperature,
                    unit: 'celsius',
                    data: weather
                });
            }
        } catch (error) {
            logger.warn(`Weather for ${city}:`, error.message);
        }
    }

    return results;
}

module.exports = {
    getCurrentWeather,
    getForecast,
    fetch
};
