/**
 * Database Seed Script
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const logger = console;

async function seed() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL
    });

    try {
        logger.info('Starting database seeding...');

        // Read seed file
        const seedPath = path.join(__dirname, '../../../database/seed.sql');
        const seedData = fs.readFileSync(seedPath, 'utf8');

        // Execute seed
        await pool.query(seedData);
        logger.info('Seed data inserted successfully');

        // Verify counts
        const counts = await pool.query(`
            SELECT
                (SELECT COUNT(*) FROM platforms) as platforms,
                (SELECT COUNT(*) FROM platform_metrics) as metrics,
                (SELECT COUNT(*) FROM forecasts) as forecasts,
                (SELECT COUNT(*) FROM alerts) as alerts,
                (SELECT COUNT(*) FROM users) as users
        `);

        const row = counts.rows[0];
        logger.info('Data counts:');
        logger.info(`  - Platforms: ${row.platforms}`);
        logger.info(`  - Metrics: ${row.metrics}`);
        logger.info(`  - Forecasts: ${row.forecasts}`);
        logger.info(`  - Alerts: ${row.alerts}`);
        logger.info(`  - Users: ${row.users}`);

        logger.info('Seeding completed successfully!');
    } catch (error) {
        logger.error('Seeding failed:', error.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

// Run if called directly
if (require.main === module) {
    require('dotenv').config();
    seed();
}

module.exports = seed;
