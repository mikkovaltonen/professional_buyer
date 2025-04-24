import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import fs from "fs";
import type { IncomingMessage, NextFunction } from "connect";
import type { ServerResponse } from "http";

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

          // Handle API requests
          if (req.url === '/api/save-forecast' && req.method === 'POST') {
            console.log('Received save-forecast request');
            try {
              // Get the request body
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

              // Save to file in public directory
              const filePath = path.join(process.cwd(), 'public', 'forecast_adjustments.json');
              console.log('Saving to file:', filePath);
              
              // Ensure public directory exists
              const publicDir = path.join(process.cwd(), 'public');
              if (!fs.existsSync(publicDir)) {
                console.log('Creating public directory');
                fs.mkdirSync(publicDir, { recursive: true });
              }

              // Create file if it doesn't exist
              if (!fs.existsSync(filePath)) {
                console.log('Creating initial forecast_adjustments.json');
                fs.writeFileSync(filePath, JSON.stringify({ adjustments: [] }, null, 2));
              }

              // Read existing data
              console.log('Reading existing data');
              const fileContent = fs.readFileSync(filePath, 'utf-8');
              const existingData = JSON.parse(fileContent);
              console.log('Existing data:', existingData);

              // Store only the latest adjustments
              existingData.adjustments = data.adjustments;
              existingData.timestamp = new Date().toISOString();
              console.log('Updated data:', existingData);

              // Write updated data back to file
              console.log('Writing updated data to file');
              fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2));

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
