const https = require("https");

const proxyRequest = (req, res, targetBaseUrl) => {
  return new Promise((resolve, reject) => {
    const targetUrl = new URL(targetBaseUrl + req.url);

    const options = {
      hostname: targetUrl.hostname,
      port: targetUrl.port,
      path: targetUrl.pathname + targetUrl.search,
      method: req.method,
      headers: req.headers,
    };

    const proxy = https.request(options, (proxyRes) => {
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