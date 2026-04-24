const https = require("https");

const proxyRequest = (req, res, targetBaseUrl) => {
  return new Promise((resolve, reject) => {
    const targetUrl = new URL(targetBaseUrl + req.url);

    // 🔥 Limpiar headers conflictivos
    const headers = { ...req.headers };
    delete headers["host"];
    delete headers["x-forwarded-host"];
    delete headers["x-forwarded-proto"];
    delete headers["x-forwarded-for"];

    const options = {
      hostname: targetUrl.hostname,
      port: 443,
      path: targetUrl.pathname + targetUrl.search,
      method: req.method,
      headers: {
        ...headers,
        host: targetUrl.hostname,
      },
    };

    const proxy = https.request(options, (proxyRes) => {
      // 🔥 Si viene redirect (301/302), seguirlo manualmente
      if (proxyRes.statusCode === 301 || proxyRes.statusCode === 302) {
        const location = proxyRes.headers["location"];
        console.log("Redirect detected to:", location);
      }

      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res, { end: true });
      proxyRes.on("end", resolve);
    });

    req.pipe(proxy, { end: true });

    proxy.on("error", (err) => {
      console.error("Proxy error:", err);
      res.writeHead(500);
      res.end("Proxy error");
      reject(err);
    });
  });
};

module.exports = proxyRequest;