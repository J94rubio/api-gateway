const http = require("http");
const url = require("url");
const fs = require("fs");
const path = require("path");

const proxyRoutes = require("./routes/proxy.routes");

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // 🔥 CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(200);
    return res.end();
  }

  // 🧪 HEALTH
  if (pathname === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ status: "API Gateway OK" }));
  }

  // 📘 SWAGGER UNIFICADO
  if (pathname.startsWith("/docs")) {
    const filePath = path.join(__dirname, "swagger", "swagger.json");
    const data = fs.readFileSync(filePath, "utf-8");

    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(data);
  }

  // 🔁 PROXY
  const handled = await proxyRoutes(req, res, pathname);
  if (handled !== false) return;

  // ❌ NOT FOUND
  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ message: "Route not found" }));
});

module.exports = server;