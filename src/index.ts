import express from 'express';
import authRouter from './routes/auth.route';
import dotenv from 'dotenv';
import { connectDB } from './lib/db';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import messageRouter from './routes/message.route';
import { app, server } from './lib/socket';

dotenv.config();
const PORT = process.env.PORT || 3001;

app.use(cors({
    origin: [ "http://localhost:5173", // For local testing
        "https://jovial-palmier-361335.netlify.app", ],
    credentials: true,
}))
app.use(express.json({ limit: '10mb' })); // Set a higher limit
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cookieParser());

app.use('/api/auth', authRouter);
app.use('/api/messages',messageRouter);


server.listen(PORT, () => {
  
    console.log(`Server running on PORT ${PORT}`)
    connectDB();
})

