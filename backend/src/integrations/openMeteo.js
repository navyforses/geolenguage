/**
 * Open-Meteo API Integration
 * Free weather data, no API key required
 * Response time: <10ms
 */

const axios = require('axios');
const logger = require('../utils/logger');

const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const ARCHIVE_URL = 'https://archive-api.open-meteo.com/v1/archive';
const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';

// Tech hub cities
const TECH_HUBS = {
    'san_francisco': { lat: 37.7749, lon: -122.4194 },
    'seattle': { lat: 47.6062, lon: -122.3321 },
    'austin': { lat: 30.2672, lon: -97.7431 },
    'new_york': { lat: 40.7128, lon: -74.0060 },
    'london': { lat: 51.5074, lon: -0.1278 },
    'berlin': { lat: 52.5200, lon: 13.4050 },
    'bangalore': { lat: 12.9716, lon: 77.5946 },
    'tokyo': { lat: 35.6762, lon: 139.6503 },
    'singapore': { lat: 1.3521, lon: 103.8198 },
    'tbilisi': { lat: 41.6938, lon: 44.8015 }
};

/**
 * Get current weather
 */
async function getCurrentWeather(latitude, longitude) {
    try {
        const response = await axios.get(FORECAST_URL, {
            params: {
                latitude,
                longitude,
                current_weather: true,
                timezone: 'auto'
            }
        });

        const current = response.data.current_weather;
        return {
            temperature: current.temperature,
            windspeed: current.windspeed,
            winddirection: current.winddirection,
            weathercode: current.weathercode,
            isDay: current.is_day === 1,
            time: current.time,
            timezone: response.data.timezone
        };
    } catch (error) {
        logger.error('Open-Meteo current weather error:', error.message);
        return null;
    }
}

/**
 * Get weather forecast
 */
async function getForecast(latitude, longitude, days = 7) {
    try {
        const response = await axios.get(FORECAST_URL, {
            params: {
                latitude,
                longitude,
                daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode',
                timezone: 'auto',
                forecast_days: days
            }
        });

        const daily = response.data.daily;
        return daily.time.map((date, i) => ({
            date,
            tempMax: daily.temperature_2m_max[i],
            tempMin: daily.temperature_2m_min[i],
            precipitation: daily.precipitation_sum[i],
            weathercode: daily.weathercode[i]
        }));
    } catch (error) {
        logger.error('Open-Meteo forecast error:', error.message);
        return [];
    }
}

/**
 * Get historical weather
 */
async function getHistorical(latitude, longitude, startDate, endDate) {
    try {
        const response = await axios.get(ARCHIVE_URL, {
            params: {
                latitude,
                longitude,
                start_date: startDate,
                end_date: endDate,
                daily: 'temperature_2m_mean,precipitation_sum'
            }
        });

        const daily = response.data.daily;
        return daily.time.map((date, i) => ({
            date,
            tempMean: daily.temperature_2m_mean[i],
            precipitation: daily.precipitation_sum[i]
        }));
    } catch (error) {
        logger.error('Open-Meteo historical error:', error.message);
        return [];
    }
}

/**
 * Search location
 */
async function searchLocation(query, count = 5) {
    try {
        const response = await axios.get(GEOCODING_URL, {
            params: { name: query, count }
        });

        return response.data.results?.map(loc => ({
            name: loc.name,
            country: loc.country,
            latitude: loc.latitude,
            longitude: loc.longitude,
            timezone: loc.timezone,
            population: loc.population
        })) || [];
    } catch (error) {
        logger.error('Open-Meteo geocoding error:', error.message);
        return [];
    }
}

/**
 * Get weather for tech hub
 */
async function getTechHubWeather(hubName) {
    const hub = TECH_HUBS[hubName];
    if (!hub) {
        return null;
    }

    const [current, forecast] = await Promise.all([
        getCurrentWeather(hub.lat, hub.lon),
        getForecast(hub.lat, hub.lon, 3)
    ]);

    return {
        city: hubName,
        coordinates: hub,
        current,
        forecast
    };
}

/**
 * Get weather for all tech hubs
 */
async function getAllTechHubsWeather() {
    const results = {};

    for (const [city, coords] of Object.entries(TECH_HUBS)) {
        try {
            const weather = await getCurrentWeather(coords.lat, coords.lon);
            results[city] = weather;
        } catch (error) {
            logger.warn(`Weather for ${city}:`, error.message);
        }
    }

    return results;
}

/**
 * Weather code to description
 */
function weatherCodeToDescription(code) {
    const codes = {
        0: 'Clear sky',
        1: 'Mainly clear',
        2: 'Partly cloudy',
        3: 'Overcast',
        45: 'Fog',
        48: 'Depositing rime fog',
        51: 'Light drizzle',
        53: 'Moderate drizzle',
        55: 'Dense drizzle',
        61: 'Slight rain',
        63: 'Moderate rain',
        65: 'Heavy rain',
        71: 'Slight snow',
        73: 'Moderate snow',
        75: 'Heavy snow',
        77: 'Snow grains',
        80: 'Slight rain showers',
        81: 'Moderate rain showers',
        82: 'Violent rain showers',
        85: 'Slight snow showers',
        86: 'Heavy snow showers',
        95: 'Thunderstorm',
        96: 'Thunderstorm with slight hail',
        99: 'Thunderstorm with heavy hail'
    };

    return codes[code] || 'Unknown';
}

/**
 * Fetch weather data
 */
async function fetch() {
    const results = [];

    try {
        const hubsWeather = await getAllTechHubsWeather();

        results.push({
            platformId: 'weather',
            metricType: 'tech_hubs_weather',
            value: Object.keys(hubsWeather).length,
            unit: 'count',
            data: hubsWeather
        });

        // San Francisco specific (major tech hub)
        const sf = hubsWeather.san_francisco;
        if (sf) {
            results.push({
                platformId: 'weather',
                metricType: 'sf_temperature',
                value: sf.temperature,
                unit: 'celsius',
                data: sf
            });
        }
    } catch (error) {
        logger.error('Open-Meteo fetch error:', error.message);
    }

    return results;
}

module.exports = {
    getCurrentWeather,
    getForecast,
    getHistorical,
    searchLocation,
    getTechHubWeather,
    getAllTechHubsWeather,
    weatherCodeToDescription,
    fetch,
    TECH_HUBS
};
