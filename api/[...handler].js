import dotenv from 'dotenv';
import { createApp } from '../server/src/server.js';

dotenv.config();

const app = createApp();

export default app;
