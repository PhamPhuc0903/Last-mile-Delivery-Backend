import { createProxyMiddleware } from "http-proxy-middleware";

export const createServiceProxy = (target) => {
    return createProxyMiddleware({
        target,
        changeOrigin: true,

        pathRewrite: (path, req) => {
            return req.originalUrl;
        },

        on: {
            proxyReq: (proxyReq, req) => {
                if (req.body && Object.keys(req.body).length > 0) {
                    const bodyData = JSON.stringify(req.body);

                    proxyReq.setHeader("Content-Type", "application/json");
                    proxyReq.setHeader("Content-Length", Buffer.byteLength(bodyData));
                    proxyReq.write(bodyData);
                }
            },
            error: (err, req, res) => {
                console.error("Proxy error:", err.message);

                if (!res.headersSent) {
                    res.status(502).json({
                        success: false,
                        message: "Bad gateway",
                        error: err.message
                    });
                }
            }
        }
    });
};