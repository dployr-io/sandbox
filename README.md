### worker/
Lightweight Cloudflare Worker that handles API requests and proxies cloud operations to the cloud service. Stays under the 3MB bundle size limit by avoiding heavy cloud SDKs.

### service/
Node.js service containing the full multi-cloud functionality via [@tobimadehin/playground](https://github.com/tobimadehin/playground). Deployed on Railway where bundle size isn't constrained.

### Why This Split?
The [@tobimadehin/playground](https://github.com/tobimadehin/playground) package includes SDKs for AWS, Azure, Google Cloud, and Oracle Cloud, totaling ~12MB. Cloudflare Workers free tier has a 3MB limit, but the paid tier allows 10MB. This architecture keeps the worker lightweight while preserving full multi-cloud capabilities.

The worker handles Railway's sleep behavior gracefully by returning a "warming up" message when the service needs to wake up.

### What Next?
Check out dployr [@dployr-io/dployr](https://github.com/dployr-io/dployr)