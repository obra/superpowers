// src/proxy.routes.ts — wires /proxy to handleProxy.
// No URL validation happens here either.

import { Router } from 'express';
import { handleProxy } from './proxy';

export const proxyRouter = Router();
proxyRouter.get('/proxy', handleProxy);
proxyRouter.post('/proxy', handleProxy);
