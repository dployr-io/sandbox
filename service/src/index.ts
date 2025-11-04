import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { Playground, AzureProvider } from '@tobimadehin/playground';

const app = new Hono();

const providers = new Map();
providers.set('azure', new AzureProvider({
    resourceGroupName: 'dployr-sandbox',
    subscriptionId: process.env.AZURE_SUBSCRIPTION_ID!,
    location: 'Central US',
}));

const playground = new Playground({
    providers,
    imageMappingsPath: './mappings.yaml'
});

app.use('*', cors());

app.get('/health', (c) => {
    return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/api/instances', async (c) => {
    try {
        const body = await c.req.json();
        const instance = await playground.createInstance(body);

        return c.json(instance);
    } catch (error) {
        console.error('Failed to create instance:', error);
        return c.json({ error: 'Failed to create instance' }, 500);
    }
});

app.delete('/api/instances/:id', async (c) => {
    try {
        const instanceId = c.req.param('id');
        const body = await c.req.json();

        await playground.destroyInstance(body.provider, instanceId);

        return c.json({ success: true });
    } catch (error) {
        console.error('Failed to destroy instance:', error);
        return c.json({ error: 'Failed to destroy instance' }, 500);
    }
});

const port = process.env.PORT || 3000;

export default {
    port,
    fetch: app.fetch,
};