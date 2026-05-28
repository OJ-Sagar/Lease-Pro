import dotenv from 'dotenv';
import { createApp } from './server.js';

dotenv.config();

const port = Number(process.env.PORT || 4000);
const app = createApp();

app.listen(port, () => {
  console.log(`Lease Pro API listening on http://localhost:${port}`);
});
