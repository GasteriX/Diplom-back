import 'reflect-metadata';
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Audio Marketplace API')
    .setDescription('CRUD API for marketplace products')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup('api', app, swaggerDocument, {
    swaggerOptions: {
      operationsSorter: (a: { get: (key: string) => string }, b: { get: (key: string) => string }) => {
        const methodOrder: Record<string, number> = {
          get: 0,
          post: 1,
          put: 2,
          patch: 3,
          delete: 4,
        };
        const methodA = a.get('method');
        const methodB = b.get('method');
        const orderA = methodOrder[methodA] ?? 99;
        const orderB = methodOrder[methodB] ?? 99;

        if (orderA !== orderB) {
          return orderA - orderB;
        }

        return a.get('path').localeCompare(b.get('path'));
      },
    },
  });
  await app.listen(process.env.PORT ? Number(process.env.PORT) : 3000);
}

void bootstrap();
