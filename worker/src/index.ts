import { Hono } from "hono";
import { cors } from "hono/cors";

const app = new Hono<{ Bindings: Bindings }>();

type Bindings = {
    AZURE_API_TOKEN: string;
    SANDBOX_KV: KVNamespace;
};

type Instance = {
    id: string;
    ip: string;
    provider: string;
    ttl: number;
};

const CLOUD_SERVICE_URL = 'https://your-railway-service.railway.app';
const REQUEST_TIMEOUT = 10000;

async function callCloudService(endpoint: string, options: RequestInit = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    try {
        const response = await fetch(`${CLOUD_SERVICE_URL}${endpoint}`, {
            ...options,
            signal: controller.signal,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`Cloud service error: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        clearTimeout(timeoutId);

        if (error instanceof Error && (
            error.name === 'AbortError' ||
            error.message.includes('fetch') ||
            error.message.includes('network')
        )) {
            fetch(`${CLOUD_SERVICE_URL}/health`).catch(() => { });
            throw new Error('WARMING_UP');
        }

        throw error;
    }
}

app.use("*", async (c, next) => await next());
app.use("/api/*", cors());

app.post("/api/request", async (c) => {
    try {
        const body = await c.req.json();
        
        const instance = await callCloudService('/api/instances', {
            method: 'POST',
            body,
        }) as Instance;

        await c.env.SANDBOX_KV.put(instance.id, JSON.stringify(instance));

        return c.json({
            message: "Sandbox provision in progress",
            success: true,
            instanceId: instance.id
        }, 200);
    } catch (error) {
        if (error instanceof Error && error.message === 'WARMING_UP') {
            return c.json({
                error: "Service is warming up, please try again in 30-60 seconds",
                warming: true
            }, 503);
        }

        return c.json({ error: "Internal server error" }, 500);
    }
});

app.get("/api/destroy/:id", async (c) => {
    try {
        const instanceId = c.req.param('id');

        const instanceData = await c.env.SANDBOX_KV.get(instanceId);
        if (!instanceData) {
            return c.json({ error: "Instance not found" }, 404);
        }

        const instance = JSON.parse(instanceData);

        await callCloudService(`/api/instances/${instanceId}`, {
            method: 'DELETE',
            body: JSON.stringify({ provider: instance.provider }),
        });

        await c.env.SANDBOX_KV.delete(instanceId);

        return c.json({ message: "Sandbox deletion in progress", success: true }, 200);
    } catch (error) {
        if (error instanceof Error && error.message === 'WARMING_UP') {
            return c.json({
                error: "Service is warming up, please try again in 30-60 seconds",
                warming: true
            }, 503);
        }

        return c.json({ error: "Internal server error" }, 500);
    }
});

app.get("/api/health", (c) => {
    return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

export default app;