import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as os from 'os';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS for frontend app
  // Allow all origins (needed for mobile apps and Railway deployment)
  app.enableCors({
    origin: true, // Allow all origins - dynamically set based on request
    credentials: false, // Set to false when using wildcard origin
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS', 'PUT'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'X-Requested-With',
      'Origin',
      'Access-Control-Request-Method',
      'Access-Control-Request-Headers',
    ],
    exposedHeaders: ['Content-Type'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
    maxAge: 86400, // Cache preflight requests for 24 hours
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  
  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('CommitX API')
    .setDescription('CommitX Backend API for managing commitments and completions')
    .setVersion('1.0')
    .addTag('commitments', 'Commitment management endpoints')
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  
  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  // Get local IP address
  const networkInterfaces = os.networkInterfaces();
  let localIp = 'localhost';
  
  for (const interfaceName in networkInterfaces) {
    const addresses = networkInterfaces[interfaceName];
    if (addresses) {
      for (const address of addresses) {
        // Skip internal (loopback) and non-IPv4 addresses
        if (address.family === 'IPv4' && !address.internal) {
          localIp = address.address;
          break;
        }
      }
      if (localIp !== 'localhost') break;
    }
  }
  
  console.log(`🚀 CommitX Backend running on:`);
  console.log(`   http://localhost:${port}`);
  console.log(`   http://${localIp}:${port}`);
  console.log(`📚 Swagger documentation available at:`);
  console.log(`   http://localhost:${port}/api`);
  console.log(`   http://${localIp}:${port}/api`);
}
bootstrap();

