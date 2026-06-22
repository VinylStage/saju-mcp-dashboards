/**
 * 사주 웹 애플리케이션 및 MCP 서버 엔트리포인트
 * SSE(Server-Sent Events) 기반 MCP 연결과 프론트엔드 정적 서빙(SPA)을 동시 지원합니다.
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { createMCPServer } from './core/server.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = parseInt(process.env.PORT || '3000', 10);

const transports = new Map<string, SSEServerTransport>();

// MIME Types for Static Serving
const mimeTypes: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.svg': 'image/svg+xml'
};

const httpServer = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // MCP Endpoints
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: 'saju-mcp-server' }));
    return;
  }

  if (req.method === 'GET' && req.url === '/sse') {
    const server = createMCPServer();
    const transport = new SSEServerTransport('/messages', res);
    transports.set(transport.sessionId, transport);
    res.on('close', () => transports.delete(transport.sessionId));
    await server.connect(transport);
    return;
  }

  if (req.method === 'POST' && req.url?.startsWith('/messages')) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const sessionId = url.searchParams.get('sessionId');
    if (!sessionId || !transports.has(sessionId)) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: '유효하지 않은 세션입니다' }));
      return;
    }
    await transports.get(sessionId)!.handlePostMessage(req, res);
    return;
  }

  // Data API Endpoints
  const DATA_DIR = path.join(__dirname, '../data');
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

  if (req.url?.startsWith('/api/data')) {
    const id = req.url.split('/')[3]; // e.g., /api/data/filename.json -> filename.json
    
    if (req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));
      const list = files.map(file => {
        try {
          const content = JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), 'utf-8'));
          return { id: file, meta: content.meta || {} };
        } catch (e) {
          return null;
        }
      }).filter(Boolean);
      res.end(JSON.stringify(list));
      return;
    }
    
    if (req.method === 'POST' || req.method === 'PUT') {
      let body = '';
      req.on('data', chunk => body += chunk.toString());
      req.on('end', () => {
        try {
          const data = JSON.parse(body);
          const targetId = id || `${data.meta?.name || 'unknown'}_${Date.now()}.json`;
          fs.writeFileSync(path.join(DATA_DIR, targetId), JSON.stringify(data, null, 2), 'utf-8');
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, id: targetId }));
        } catch (e: any) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: e.message }));
        }
      });
      return;
    }

    if (req.method === 'DELETE' && id) {
      try {
        fs.unlinkSync(path.join(DATA_DIR, id));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (e: any) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
      return;
    }
  }

  // Static File Serving (Web GUI SPA)
  if (req.method === 'GET') {
    const urlPath = req.url ? (req.url === '/' ? '/index.html' : (req.url as string)) : '/index.html';
    
    // Security check against path traversal
    if (urlPath.includes('..')) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }

    const filePath = path.join(__dirname, '../frontend/dist', (urlPath.split('?')[0] as string));
    const extname = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
      if (err) {
        if (err.code === 'ENOENT') {
          // SPA fallback to index.html
          fs.readFile(path.join(__dirname, '../frontend/dist/index.html'), (err2, fallback) => {
            if (err2) {
              res.writeHead(404);
              res.end('Frontend not built. Run yarn build in frontend/ directory.');
            } else {
              res.writeHead(200, { 'Content-Type': 'text/html' });
              res.end(fallback, 'utf-8');
            }
          });
        } else {
          res.writeHead(500);
          res.end(`Server Error: ${err.code}`);
        }
      } else {
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content, 'utf-8');
      }
    });
    return;
  }
});

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`✨ 프리미엄 사주 대시보드 서버가 포트 ${PORT}에서 실행 중입니다.`);
  console.log(`🌐 Web GUI: http://localhost:${PORT}`);
  console.log(`🔌 MCP SSE: http://0.0.0.0:${PORT}/sse`);
});

process.on('SIGINT', () => { httpServer.close(); process.exit(0); });
process.on('SIGTERM', () => { httpServer.close(); process.exit(0); });
