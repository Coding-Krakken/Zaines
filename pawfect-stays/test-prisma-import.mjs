// Simple smoke test to verify Prisma client can be imported
import { prisma } from './src/lib/prisma.js';

console.log('✓ Prisma client imported successfully');
console.log(`✓ Type: ${typeof prisma}`);
console.log('✓ No "engine type client requires adapter" error');

// Verify that prisma has expected methods
if (typeof prisma.$connect === 'function') {
  console.log('✓ prisma.$connect exists');
} else {
  throw new Error('✗ prisma.$connect method not found');
}

process.exit(0);
