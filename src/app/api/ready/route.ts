// src/app/api/ready/route.ts
import { createReadinessAPI } from '@/middleware/environment';

export const GET = createReadinessAPI();