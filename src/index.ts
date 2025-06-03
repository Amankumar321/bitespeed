import 'reflect-metadata';
import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import { identifyRouter } from './routes/identify';
import { AppDataSource } from './database/data-source';
import swaggerDocument from './swagger/swagger';

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(express.json());

// Error handling middleware for JSON parsing errors
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({ error: 'Invalid JSON payload' });
  }
  next(err);
});

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Routes
app.use('/identify', identifyRouter);

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  const errorMessage = err instanceof Error ? err.message : 'Internal server error';
  res.status(500).json({ error: errorMessage });
});

// Initialize database connection and start server
AppDataSource.initialize()
  .then(() => {
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
      console.log(`API documentation available at http://localhost:${port}/api-docs`);
    });
  })
  .catch((error) => {
    console.error('Error during Data Source initialization:', error);
    process.exit(1);
  }); 