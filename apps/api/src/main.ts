import "dotenv/config";
import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, type NestFastifyApplication } from "@nestjs/platform-fastify";
import { AppModule } from "./app.module.js";

const devOrigins = ["http://127.0.0.1:5173", "http://localhost:5173", "http://127.0.0.1:5175", "http://localhost:5175"];

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());
  // In production the web app reaches the API through a same-origin rewrite
  // (Vercel /api/* -> Railway), so CORS_ORIGINS is only needed if the API is
  // ever called cross-origin directly.
  const corsOrigins = (process.env.CORS_ORIGINS ?? "").split(",").map((origin) => origin.trim()).filter(Boolean);
  app.enableCors({
    credentials: true,
    origin: corsOrigins.length > 0 ? corsOrigins : devOrigins
  });
  app.setGlobalPrefix("api");

  const port = Number(process.env.PORT ?? 3000);
  // 0.0.0.0 so container hosts (Railway) can route traffic; HOST=127.0.0.1 to restrict locally.
  const host = process.env.HOST ?? "0.0.0.0";
  await app.listen(port, host);
}

void bootstrap();
