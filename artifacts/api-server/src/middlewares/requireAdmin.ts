import { type Request, type Response, type NextFunction } from "express";
import { isAdminEmail } from "../lib/admin";

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: "You must be logged in" });
    return;
  }
  if (!isAdminEmail(req.user.email)) {
    res.status(403).json({ error: "Admin access required" });
    return;
  }
  next();
}
