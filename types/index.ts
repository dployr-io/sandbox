export type Bindings = {
  // Storage
  BASE_KV: KVNamespace;

  // App config
  WEB_URL: string;
  BASE_URL: string;
};

export interface Instance {
  id: string;
  address: string;
  tag: string;
  metadata?: Record<string, any> | undefined
  createdAt: number;
  updatedAt: number;
}
