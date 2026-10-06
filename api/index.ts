import type { Request, Response } from 'express';
import { createApp } from '../server';

let appPromise: ReturnType<typeof createApp> | undefined;

export default async function handler(req: Request, res: Response) {
  try {
    appPromise ??= createApp();
    const app = await appPromise;
    app(req, res);
  } catch (err: any) {
    console.error('Vercel Serverless Function error:', err);
    res.status(500).json({
      error: err?.message || 'A server error occurred during request processing.',
    });
  }
}
