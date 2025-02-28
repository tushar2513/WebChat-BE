import express from "express";
import { getMessages, getUserSidebar, sendMessage } from "../controllers/message.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const messageRouter = express.Router();

messageRouter.get('/users', authMiddleware, getUserSidebar);

messageRouter.get('/:id', authMiddleware, getMessages);

messageRouter.post('/send/:id', authMiddleware, sendMessage);

export default messageRouter;