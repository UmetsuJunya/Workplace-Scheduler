// Prisma 7.0 migration configuration
// This file is required for Prisma Migrate to work with Prisma 7.0+
// See: https://pris.ly/d/config-datasource

import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
})
