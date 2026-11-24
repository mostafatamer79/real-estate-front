// Optional read-only synthetic API for local server-rendered metadata checks.
const http = require('node:http');
const { responseFor } = require('./details-ui.cjs');
const port = Number(process.env.FIXTURE_PORT || 3030);
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw Error('Invalid fixture port');
http.createServer((request, response) => {
  response.setHeader('Content-Type', 'application/json');
  if (!['GET', 'OPTIONS'].includes(request.method)) {
    response.writeHead(405);
    return response.end(JSON.stringify({message:'Read-only fixture'}));
  }
  const path = new URL(request.url, 'http://127.0.0.1').pathname;
  response.end(JSON.stringify(responseFor(path)));
}).listen(port, '127.0.0.1', () => process.stdout.write(`Read-only local fixture listening on 127.0.0.1:${port}\n`));
