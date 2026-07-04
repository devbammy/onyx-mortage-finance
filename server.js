const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const REVIEWS_FILE = path.join(__dirname, 'reviews.json');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function serveFile(res, filePath, contentType) {
  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end(`500 Internal Server Error: ${err.code}`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
}

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;

  // API Endpoints
  if (pathname === '/api/reviews' || pathname === '/reviews.php') {
    if (req.method === 'GET') {
      fs.readFile(REVIEWS_FILE, 'utf8', (err, data) => {
        if (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Could not read reviews file' }));
          return;
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(data);
      });
      return;
    }

    if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      req.on('end', () => {
        try {
          const newReview = JSON.parse(body);

          // Simple Validation
          if (!newReview.name || !newReview.location || !newReview.rating || !newReview.text) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Missing required fields (name, location, rating, text)' }));
            return;
          }

          // Read, parse, append, and save
          fs.readFile(REVIEWS_FILE, 'utf8', (err, data) => {
            let reviews = [];
            if (!err) {
              try {
                reviews = JSON.parse(data);
              } catch (parseErr) {
                reviews = [];
              }
            }

            // Ensure date is set
            newReview.date = newReview.date || new Date().toISOString().split('T')[0];
            newReview.rating = Number(newReview.rating);

            reviews.push(newReview);

            fs.writeFile(REVIEWS_FILE, JSON.stringify(reviews, null, 2), 'utf8', (writeErr) => {
              if (writeErr) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Could not save review to file' }));
                return;
              }
              res.writeHead(201, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify(newReview));
            });
          });

        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid JSON body' }));
        }
      });
      return;
    }
  }

  // Static File Serving
  let relativePath = pathname === '/' ? 'index.html' : pathname.substring(1);
  let filePath = path.join(__dirname, relativePath);
  
  // Safe directory check to prevent directory traversal
  const relative = path.relative(__dirname, filePath);
  const isSafe = relative && !relative.startsWith('..') && !path.isAbsolute(relative);
  
  if (pathname !== '/' && !isSafe) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  serveFile(res, filePath, contentType);
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});
