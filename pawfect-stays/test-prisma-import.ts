// Simple smoke test to verify Prisma client can be imported
// This test does not require a database connection, just validates the module loads
import { prisma, isDatabaseConfigured } from './src/lib/prisma';

console.log('✓ Prisma client imported successfully');
console.log(`✓ Type: ${typeof prisma}`);
console.log('✓ No "engine type client requires adapter" error');

// Verify that prisma has expected methods
if (typeof prisma.$connect === 'function') {
  console.log('✓ prisma.$connect exists');
} else {
  throw new Error('✗ prisma.$connect method not found');
}

// Verify helper function exists
if (typeof isDatabaseConfigured === 'function') {
  console.log('✓ isDatabaseConfigured helper exists');
  console.log(`✓ Database configured: ${isDatabaseConfigured()}`);
} else {
  throw new Error('✗ isDatabaseConfigured helper not found');
}

console.log('\n✅ All smoke tests passed!');
process.exit(0);