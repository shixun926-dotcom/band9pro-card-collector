import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const PORT = Number(process.env.PORT || 4173);
const HOST = "127.0.0.1";
const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".png": "image/png"
};

function resolveRequestPath(requestUrl) {
  const url = new URL(requestUrl, `http://${HOST}:${PORT}`);
  let pathname =
    url.pathname === "/" ? "/simulator/index.html" : url.pathname;

  if (pathname.endsWith("/")) {
    pathname += "index.html";
  }

  const absolutePath = resolve(
    ROOT,
    `.${decodeURIComponent(pathname)}`
  );
  const rootPrefix = `${ROOT}${sep}`;

  if (
    absolutePath !== ROOT &&
    !absolutePath.startsWith(rootPrefix)
  ) {
    return null;
  }

  return absolutePath;
}

const server = createServer((request, response) => {
  const absolutePath = resolveRequestPath(request.url || "/");

  if (
    !absolutePath ||
    !existsSync(absolutePath) ||
    statSync(absolutePath).isDirectory()
  ) {
    response.writeHead(404, {
      "Content-Type": "text/plain; charset=utf-8"
    });
    response.end("Not found");
    return;
  }

  response.writeHead(200, {
    "Content-Type":
      MIME_TYPES[extname(absolutePath)] ||
      "application/octet-stream",
    "Cache-Control": "no-store"
  });
  createReadStream(absolutePath).pipe(response);
});

server.listen(PORT, HOST, () => {
  console.log(
    `Simulator available at http://${HOST}:${PORT}/simulator/`
  );
});
