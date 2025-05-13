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
            let data: any; // Define data here to be accessible in catch
            try {
              const chunks = [];
              for await (const chunk of req) {
                chunks.push(chunk);
              }
              data = JSON.parse(Buffer.concat(chunks).toString());
              
              if (Array.isArray(data)) {
                console.log(`[vite.config.ts] /api/forecast-data: Preparing to save ${data.length} items to forecastData.`);
              } else {
                console.warn(`[vite.config.ts] /api/forecast-data: Received data is not an array, type: ${typeof data}. Full data:`, data);
              }
              forecastData = data;
              console.log(`[vite.config.ts] /api/forecast-data: Successfully saved ${forecastData.length} items.`);
              
              res.writeHead(200, { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
              });
              res.end(JSON.stringify({ success: true }));
              return;
            } catch (error) {
              console.error('[vite.config.ts] /api/forecast-data: Error saving forecast data:', error instanceof Error ? error.message : error, 'Input data snapshot:', data ? JSON.stringify(data).substring(0, 200) + '...' : 'undefined');
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
            console.log('[vite.config.ts] /api/save-forecast: Received save-forecast request.');
            let rawData: string | undefined; // Define rawData here
            let data: any; // Define data here
            try {
              const chunks = [];
              for await (const chunk of req) {
                chunks.push(chunk);
              }
              rawData = Buffer.concat(chunks).toString();
              console.log('[vite.config.ts] /api/save-forecast: Received raw data length:', rawData.length);
              
              data = JSON.parse(rawData);
              if (data && data.adjustments && Array.isArray(data.adjustments)) {
                console.log(`[vite.config.ts] /api/save-forecast: Parsed request data. Adjustments count: ${data.adjustments.length}. Timestamp from data: ${data.timestamp}`);
              } else {
                console.warn('[vite.config.ts] /api/save-forecast: Parsed request data is not in expected format (missing adjustments array). Data:', data);
              }

              if (!data.adjustments || !Array.isArray(data.adjustments)) {
                console.error('[vite.config.ts] /api/save-forecast: Invalid request data: adjustments array is required. Received:', data);
                res.writeHead(400, { 
                  'Content-Type': 'application/json',
                  'Access-Control-Allow-Origin': '*'
                });
                res.end(JSON.stringify({ 
                  error: 'Invalid request data: adjustments array is required',
                  details: 'Received data is not an array'
                }));
                return;
              }

              // Store in memory
              const oldAdjustmentsCount = forecastAdjustments.adjustments.length;
              forecastAdjustments = {
                adjustments: data.adjustments,
                timestamp: data.timestamp || new Date().toISOString()
              };
              console.log(`[vite.config.ts] /api/save-forecast: Forecast adjustments updated. Previous count: ${oldAdjustmentsCount}, New count: ${forecastAdjustments.adjustments.length}. New timestamp: ${forecastAdjustments.timestamp}`);
              
              res.writeHead(200, { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
              });
              res.end(JSON.stringify({ success: true, message: `Saved ${forecastAdjustments.adjustments.length} adjustments.` }));
              console.log('[vite.config.ts] /api/save-forecast: Save forecast request completed successfully.');
              return;
            } catch (error) {
              console.error('[vite.config.ts] /api/save-forecast: Error saving forecast adjustments:', error instanceof Error ? error.message : error, 'Input data snapshot:', data ? JSON.stringify(data).substring(0, 200) + '...' : 'undefined', 'Raw data snapshot:', rawData ? rawData.substring(0, 200) + '...' : 'undefined');
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
    proxy: {
      '/api': {
        target: 'https://scmbp.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/REST/v1/genaibase/kemppi_Kemppi_100_FG_sales_m_assistant_input_forecasts_separated'),
        secure: false,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      }
    }
  },
});
