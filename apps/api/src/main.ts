import { NestFactory } from '@nestjs/core';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { AppModule } from './app.module';

function loadEnv() {
  const candidates = ['.env.local', '.env'];
  for (const file of candidates) {
    const full = resolve(process.cwd(), file);
    if (existsSync(full)) {
      try {
        process.loadEnvFile(full);
      } catch {
        // ignore — Node <20.12 fallback handled by deploy env vars
      }
    }
  }
}

async function bootstrap() {
  loadEnv();
  const app = await NestFactory.create(AppModule, { cors: true });
  const port = Number(process.env.PORT) || 3002;
  await app.listen(port);
}
bootstrap();
