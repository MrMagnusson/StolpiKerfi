// Express 4 does not forward rejected promises from async route handlers to error middleware —
// an unhandled rejection there just hangs the request. Every route is wrapped with this so any
// thrown/rejected error reaches errorHandler.ts instead of leaving the client waiting forever.
import type { NextFunction, Request, RequestHandler, Response } from "express";

export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
