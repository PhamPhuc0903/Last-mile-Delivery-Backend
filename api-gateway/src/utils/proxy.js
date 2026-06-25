import { createProxyMiddleware } from "http-proxy-middleware";

export const createServiceProxy = (target) => {
    return createProxyMiddleware({
        target,
        changeOrigin: true,
        on: {
            error: (err, req, res) => {
                console.error("Proxy error:", err.message);

                if (!res.headersSent) {
                    res.status(502).json({
                        success: false,
                        message: "Bad gateway",
                        serviceTarget: target
                    });
                }
            }
        }
    });
};