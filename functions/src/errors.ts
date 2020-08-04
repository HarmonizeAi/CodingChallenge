import { Request, Response, NextFunction } from "express"

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  res.status(err.status || 500);
  if (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test") {
    console.error(`ERROR req ${req.url}`, err);
    res.json({ error: err.message, stack: err.stack });
  } else {
    console.error(`ERROR req ${req.url}`, err.message);
    res.json({ error: err.message });
  }
}