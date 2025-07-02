// src/app/api/health/route.ts
import { createHealthCheckAPI } from '@/middleware/environment';

export const GET = createHealthCheckAPI();