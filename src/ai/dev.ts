import { config } from 'dotenv';
config();

import '@/ai/flows/detect-forgery.ts';
import '@/ai/flows/analyze-document.ts';