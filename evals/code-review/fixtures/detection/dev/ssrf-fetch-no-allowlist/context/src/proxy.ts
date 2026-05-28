// src/proxy.ts — HTTP proxy endpoint.
// Existing helper: validates the URL is syntactically a URL, but does NOT
// restrict the host. New code in the diff calls fetch() with the raw URL.

import { Request, Response } from 'express';

export function parseUrl(raw: string): URL {
    return new URL(raw); // throws if malformed
}

export async function handleProxy(req: Request, res: Response): Promise<void> {
    const raw = String(req.query.url ?? '');
    if (!raw) {
        res.status(400).send('missing url');
        return;
    }
    const url = parseUrl(raw);

    // CHANGED in this PR: previously delegated to a vetted backend.
    // The new implementation fetches the URL directly with no host
    // allowlist or private-IP check.
    const upstream = await fetch(url.toString(), {
        method: req.method,
        headers: { 'user-agent': 'corp-proxy/1.0' },
    });
    const body = await upstream.text();
    res.status(upstream.status).type(upstream.headers.get('content-type') ?? 'text/plain').send(body);
}
