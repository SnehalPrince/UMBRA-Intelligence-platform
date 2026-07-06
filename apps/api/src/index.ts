import app from './app';
import { prisma } from './lib/prisma';
import { redis } from './lib/redis';

const PORT = process.env.PORT || 4000;

async function bootstrap() {
  try {
    // Check connections
    await prisma.$connect();
    console.log('✅ PostgreSQL Connected');
    
    await redis.ping();
    console.log('✅ Redis Connected');

    app.listen(PORT, () => {
      console.log(`🚀 UMBRA API Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();

// Handle unexpected closures
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  await redis.quit();
  process.exit(0);
});
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  await redis.quit();
  process.exit(0);
});
