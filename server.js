import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import http from "node:http";

const port = Number(process.env.PORT || 3000);
const distPath = resolve("dist");

const mimeMap = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon"
};

function sendFile(res, filePath) {
  const ext = extname(filePath).toLowerCase();
  const type = mimeMap[ext] || "application/octet-stream";
  res.writeHead(200, { "Content-Type": type });
  createReadStream(filePath).pipe(res);
}

const server = http.createServer((req, res) => {
  const rawPath = req.url?.split("?")[0] || "/";
  const cleanedPath = rawPath.replace(/^\/+/, "");
  const targetPath = join(distPath, cleanedPath);

  if (existsSync(targetPath) && statSync(targetPath).isFile()) {
    sendFile(res, targetPath);
    return;
  }

  const fallback = join(distPath, "index.html");
  if (existsSync(fallback)) {
    sendFile(res, fallback);
    return;
  }

  res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("Build output not found. Run npm run build first.");
});

server.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
