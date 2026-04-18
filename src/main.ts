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
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup('api', app, swaggerDocument);
  await app.listen(process.env.PORT ? Number(process.env.PORT) : 3000);
}

void bootstrap();
