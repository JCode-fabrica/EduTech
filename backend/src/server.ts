import { createServer } from './setup';

const app = createServer();
const port = Number(process.env.PORT || 4000);

app.listen(port, () => {
  console.log(`[jcode] API listening on http://localhost:${port}`);
});
