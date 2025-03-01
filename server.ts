import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { initScheduler } from './src/lib/scheduler';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  initScheduler();

  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('Internal server error');
    }
  }).listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
}); 