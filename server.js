const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8001;
const DIST = path.join(__dirname, 'uncertainty-app', 'dist');

const mime = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

http.createServer((req, res) => {
  let filePath = path.join(DIST, req.url === '/' ? 'index.html' : req.url);
  if (!fs.existsSync(filePath)) filePath = path.join(DIST, 'index.html');
  const ext = path.extname(filePath);
  res.setHeader('Content-Type', mime[ext] || 'text/plain');
  fs.createReadStream(filePath).pipe(res);
}).listen(PORT, () => console.log(`Running on port ${PORT}`));
