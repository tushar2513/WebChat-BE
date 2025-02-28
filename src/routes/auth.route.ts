import express from "express"
import { Router } from "express";
import { checkAuth, login, logout, signup, updateUserProfile } from "../controllers/auth.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const authRouter = Router();

authRouter.post('/signup', signup)

authRouter.post('/login', login)

authRouter.post('/logout', logout)

authRouter.put('/update-profile', authMiddleware, updateUserProfile)

authRouter.get('/check', authMiddleware, checkAuth);

export default authRouter;