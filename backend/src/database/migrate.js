/**
 * Database Migration Script
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const logger = console;

async function migrate() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL
    });

    try {
        logger.info('Starting database migration...');

        // Read schema file
        const schemaPath = path.join(__dirname, '../../../database/schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        // Execute schema
        await pool.query(schema);
        logger.info('Schema applied successfully');

        // Check if tables were created
        const result = await pool.query(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            ORDER BY table_name
        `);

        logger.info('Created tables:');
        result.rows.forEach(row => {
            logger.info(`  - ${row.table_name}`);
        });

        logger.info('Migration completed successfully!');
    } catch (error) {
        logger.error('Migration failed:', error.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

// Run if called directly
if (require.main === module) {
    require('dotenv').config();
    migrate();
}

module.exports = migrate;
