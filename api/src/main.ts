import { createNestApp } from './create-app.js';

// Arranque local: npm run start:dev. En Vercel no se usa este archivo; ver api/index.ts.
const app = await createNestApp();
await app.listen(process.env.PORT ?? 3000);
