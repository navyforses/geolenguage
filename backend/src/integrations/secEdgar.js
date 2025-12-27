/**
 * SEC EDGAR API Integration
 * Free, real-time SEC filings data
 * Rate limit: 10 requests/second
 */

const axios = require('axios');
const logger = require('../utils/logger');
const rateLimiter = require('../utils/rateLimiter');

const BASE_URL = 'https://data.sec.gov';

// Company CIK numbers
const COMPANY_CIKS = {
    'alphabet': '0001652044',
    'google': '0001652044',
    'meta': '0001326801',
    'facebook': '0001326801',
    'amazon': '0001018724',
    'microsoft': '0000789019',
    'reddit': '0001713445'
};

const headers = {
    'User-Agent': 'DigitalOligopolyForecast contact@digitaloligopoly.app',
    'Accept-Encoding': 'gzip, deflate'
};

/**
 * Get company filings by CIK
 */
async function getCompanyFilings(cik) {
    return rateLimiter.execute('sec_edgar', async () => {
        const paddedCik = cik.toString().padStart(10, '0');
        const url = `${BASE_URL}/submissions/CIK${paddedCik}.json`;

        const response = await axios.get(url, { headers });
        return response.data;
    });
}

/**
 * Get recent filings for a company
 */
async function getRecentFilings(companyName, count = 10) {
    const cik = COMPANY_CIKS[companyName.toLowerCase()];
    if (!cik) {
        throw new Error(`Unknown company: ${companyName}`);
    }

    const filings = await getCompanyFilings(cik);

    const recentFilings = filings.filings?.recent || {};
    const forms = recentFilings.form || [];
    const filingDates = recentFilings.filingDate || [];
    const accessionNumbers = recentFilings.accessionNumber || [];
    const primaryDocuments = recentFilings.primaryDocument || [];

    return forms.slice(0, count).map((form, i) => ({
        form,
        filingDate: filingDates[i],
        accessionNumber: accessionNumbers[i],
        document: primaryDocuments[i],
        url: `https://www.sec.gov/Archives/edgar/data/${cik.replace(/^0+/, '')}/${accessionNumbers[i].replace(/-/g, '')}/${primaryDocuments[i]}`
    }));
}

/**
 * Get company facts (financial data)
 */
async function getCompanyFacts(companyName) {
    const cik = COMPANY_CIKS[companyName.toLowerCase()];
    if (!cik) {
        throw new Error(`Unknown company: ${companyName}`);
    }

    return rateLimiter.execute('sec_edgar', async () => {
        const paddedCik = cik.toString().padStart(10, '0');
        const url = `${BASE_URL}/api/xbrl/companyfacts/CIK${paddedCik}.json`;

        const response = await axios.get(url, { headers });
        return response.data;
    });
}

/**
 * Get latest 10-K or 10-Q filing
 */
async function getLatestAnnualReport(companyName) {
    const filings = await getRecentFilings(companyName, 50);

    const annualReport = filings.find(f => f.form === '10-K');
    const quarterlyReport = filings.find(f => f.form === '10-Q');

    return {
        annual: annualReport || null,
        quarterly: quarterlyReport || null
    };
}

/**
 * Fetch data for all tracked companies
 */
async function fetch() {
    const results = [];

    for (const [company, cik] of Object.entries(COMPANY_CIKS)) {
        try {
            const filings = await getRecentFilings(company, 5);
            const latestReport = await getLatestAnnualReport(company);

            results.push({
                platformId: company,
                metricType: 'sec_filings',
                value: filings.length,
                unit: 'count',
                data: {
                    filings,
                    latestReport
                }
            });
        } catch (error) {
            logger.error(`SEC EDGAR error for ${company}:`, error.message);
        }
    }

    return results;
}

module.exports = {
    getCompanyFilings,
    getRecentFilings,
    getCompanyFacts,
    getLatestAnnualReport,
    fetch,
    COMPANY_CIKS
};
