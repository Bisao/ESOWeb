import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupGameServer } from "./game/gameServer";

export async function registerRoutes(app: Express): Promise<Server> {
  // Create HTTP server
  const httpServer = createServer(app);
  
  // Set up game server with Socket.io
  setupGameServer(httpServer);
  
  // API routes
  app.get('/api/status', (req, res) => {
    res.json({ status: 'ok', message: 'Game server is running' });
  });
  
  return httpServer;
}
