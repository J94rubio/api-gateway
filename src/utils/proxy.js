// const https = require("https");

// const proxyRequest = (req, res, targetBaseUrl) => {
//   return new Promise((resolve, reject) => {
//     const targetUrl = new URL(targetBaseUrl + req.url);

//     const headers = { ...req.headers };
//     delete headers["host"];
//     delete headers["x-forwarded-host"];
//     delete headers["x-forwarded-proto"];
//     delete headers["x-forwarded-for"];

//     const options = {
//       hostname: targetUrl.hostname,
//       port: 443,
//       path: targetUrl.pathname + targetUrl.search,
//       method: req.method,
//       headers: {
//         ...headers,
//         host: targetUrl.hostname,
//       },
//     };

//     const proxy = https.request(options, (proxyRes) => {
//       res.setHeader("Access-Control-Allow-Origin", "*");
//       res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
//       res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
//       //🔥 Seguir redirects internamente en vez de reenviarlos al cliente
//       if (proxyRes.statusCode === 301 || proxyRes.statusCode === 302 || proxyRes.statusCode === 308) {
//         const location = proxyRes.headers["location"];
//         console.log("↪ Redirect interno hacia:", location);

//         const redirectUrl = new URL(location);
//         const redirectOptions = {
//           hostname: redirectUrl.hostname,
//           port: 443,
//           path: redirectUrl.pathname + redirectUrl.search,
//           method: req.method,
//           headers: {
//             ...headers,
//             host: redirectUrl.hostname,
//           },
//         };

//         const redirectProxy = https.request(redirectOptions, (redirectRes) => {
//           // 🔥 Eliminar headers de redirect del response final
//           const cleanHeaders = { ...redirectRes.headers };
//           delete cleanHeaders["location"];

//           res.writeHead(redirectRes.statusCode, cleanHeaders);
//           redirectRes.pipe(res, { end: true });
//           redirectRes.on("end", resolve);
//         });

//         redirectProxy.on("error", (err) => {
//           console.error("Redirect proxy error:", err);
//           res.writeHead(500);
//           res.end("Redirect proxy error");
//           reject(err);
//         });

//         redirectProxy.end();
//         return;
//       }

//       // 🔥 Eliminar location header del response normal
//       const cleanHeaders = { ...proxyRes.headers };
//       delete cleanHeaders["location"];

//       res.writeHead(proxyRes.statusCode, cleanHeaders);
//       proxyRes.pipe(res, { end: true });
//       proxyRes.on("end", resolve);
//     });

//     req.pipe(proxy, { end: true });

//     proxy.on("error", (err) => {
//       console.error("Proxy error:", err);
//       res.writeHead(500);
//       res.end("Proxy error");
//       reject(err);
//     });
//   });
// };

// module.exports = proxyRequest;
const https = require("https");

const proxyRequest = (req, res, targetBaseUrl) => {
  return new Promise((resolve, reject) => {
    // 🧠 Construir URL correctamente
    const targetUrl = new URL(req.url, targetBaseUrl);

    // 🧹 Clonar headers y limpiar los problemáticos
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

    // 🔥 Manejo de preflight (OPTIONS)
    if (req.method === "OPTIONS") {
      res.writeHead(200);
      res.end();
      return resolve();
    }

    const proxy = https.request(options, (proxyRes) => {
      // 🔁 Manejo de redirects (solo 1 nivel, evita loops)
      if ([301, 302, 308].includes(proxyRes.statusCode)) {
        const location = proxyRes.headers["location"];

        if (!location) {
          res.writeHead(proxyRes.statusCode);
          return res.end();
        }

        console.log("↪ Redirect interno hacia:", location);

        const redirectUrl = new URL(location);

        const redirectOptions = {
          hostname: redirectUrl.hostname,
          port: 443,
          path: redirectUrl.pathname + redirectUrl.search,
          method: req.method,
          headers: {
            ...headers,
            host: redirectUrl.hostname,
          },
        };

        const redirectProxy = https.request(redirectOptions, (redirectRes) => {
          const cleanHeaders = { ...redirectRes.headers };
          delete cleanHeaders["location"];

          res.writeHead(redirectRes.statusCode, cleanHeaders);
          redirectRes.pipe(res, { end: true });
          redirectRes.on("end", resolve);
        });

        redirectProxy.on("error", (err) => {
          console.error("Redirect proxy error:", err);
          res.writeHead(500);
          res.end("Redirect proxy error");
          reject(err);
        });

        redirectProxy.end();
        return;
      }

      // 🧹 Limpiar headers problemáticos
      const cleanHeaders = { ...proxyRes.headers };
      delete cleanHeaders["location"];

      res.writeHead(proxyRes.statusCode, cleanHeaders);
      proxyRes.pipe(res, { end: true });
      proxyRes.on("end", resolve);
    });

    // 📤 Enviar body si existe
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