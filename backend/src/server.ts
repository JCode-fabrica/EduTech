import { createServer } from './setup';
import { bootstrapAdmin } from './bootstrap';

const app = createServer();
bootstrapAdmin().then(() => {
  console.log('[edutech] bootstrap ok');
}).catch((e) => console.error('[jcode] bootstrap error', e));
const port = Number(process.env.PORT || 4000);

app.listen(port, () => {
  console.log(`[edutech] API listening on http://localhost:${port}`);
});
