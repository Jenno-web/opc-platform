import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json } from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  // 头像走 base64 塞进 JSON body，Express body-parser 默认 100kb 上限对图片来说太小，
  // 调到 5mb（比后端 DTO 里 avatarUrl 3,000,000 字符的校验上限留了余量）
  app.use(json({ limit: '5mb' }));

  const config = new DocumentBuilder()
    .setTitle('OPC 供需平台 API')
    .setDescription('五大业务模块 + 六大 AI 能力，数据字段以此文档为准')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
