import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Test Route
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'MealMate API is running' });
});

// Start Server
app.listen(port, () => {
  console.log(`Server compiled and listening on http://localhost:${port}`);
});