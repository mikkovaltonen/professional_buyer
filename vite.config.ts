import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import fs from "fs";
import type { IncomingMessage, NextFunction } from "connect";
import type { ServerResponse } from "http";

// In-memory storage for forecast data
let forecastData: any[] = [];
let forecastAdjustments: { adjustments: any[], timestamp: string } = { adjustments: [], timestamp: new Date().toISOString() };

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'configure-server',
      configureServer(server) {
        server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next: NextFunction) => {
          // Handle CORS preflight
          if (req.method === 'OPTIONS') {
            res.writeHead(204, {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type',
            });
            res.end();
            return;
          }

          // Handle forecast data requests
          if (req.url === '/api/forecast-data' && req.method === 'GET') {
            res.writeHead(200, { 
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            });
            res.end(JSON.stringify(forecastData));
            return;
          }

          if (req.url === '/api/forecast-data' && req.method === 'POST') {
            try {
              const chunks = [];
              for await (const chunk of req) {
                chunks.push(chunk);
              }
              const data = JSON.parse(Buffer.concat(chunks).toString());
              
              if (!Array.isArray(data)) {
                throw new Error('Invalid request data: array expected');
              }

              forecastData = data;
              
              res.writeHead(200, { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
              });
              res.end(JSON.stringify({ success: true }));
              return;
            } catch (error) {
              console.error('Error saving forecast data:', error);
              res.writeHead(500, { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
              });
              res.end(JSON.stringify({ 
                error: 'Failed to save forecast data',
                details: error instanceof Error ? error.message : 'Unknown error'
              }));
              return;
            }
          }

          // Handle forecast adjustments requests
          if (req.url === '/api/save-forecast' && req.method === 'POST') {
            console.log('Received save-forecast request');
            try {
              const chunks = [];
              for await (const chunk of req) {
                chunks.push(chunk);
              }
              const rawData = Buffer.concat(chunks).toString();
              console.log('Received raw data:', rawData);
              
              const data = JSON.parse(rawData);
              console.log('Parsed request data:', data);

              if (!data.adjustments || !Array.isArray(data.adjustments)) {
                throw new Error('Invalid request data: adjustments array is required');
              }

              // Store in memory
              forecastAdjustments = {
                adjustments: data.adjustments,
                timestamp: new Date().toISOString()
              };
              
              res.writeHead(200, { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
              });
              res.end(JSON.stringify({ success: true }));
              console.log('Save forecast request completed successfully');
              return;
            } catch (error) {
              console.error('Error saving forecast:', error);
              res.writeHead(500, { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
              });
              res.end(JSON.stringify({ 
                error: 'Failed to save forecast',
                details: error instanceof Error ? error.message : 'Unknown error'
              }));
              return;
            }
          }

          // Handle forecast adjustments read requests
          if (req.url === '/api/forecast-adjustments' && req.method === 'GET') {
            res.writeHead(200, { 
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            });
            res.end(JSON.stringify(forecastAdjustments));
            return;
          }

          next();
        });
      }
    }
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: "::",
    port: 8080,
    open: true,
    strictPort: true,
  },
});
