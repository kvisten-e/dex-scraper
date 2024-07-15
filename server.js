// server.js
import http from 'http';
import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const hostname = '127.0.0.1';
const port = 3000;

const app = express();

// Enable CORS for all routes
app.use(cors());

app.get('/data', async (req, res) => {
  try {
    const data = await readFile(path.join('./src/data/telegram.json'), 'utf8');
    res.status(200).json(JSON.parse(data));
  } catch (error) {
    res.status(500).send('Internal Server Error');
  }
});

const server = http.createServer(app);

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
