import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { UserModel } from "../models/user.model";
import mongoose, { Types } from "mongoose";

export interface CustomRequest extends Request {
    cookies: { [key: string]: string };
    user?: {
        fullName: string,
        username: string,
        profilePic: string,
        email: string,
        _id: Types.ObjectId,
        createdAt: Date,
        updatedAt: Date,
    };
}

export const authMiddleware = async (req: CustomRequest, res: Response, next: NextFunction) : Promise<any> => {
    try {
        const token = req.cookies.jwt;

        if (!token) {
            return res.status(401).json({ message: "Unauthorized: No token provided" });
        }

        const JWT_SECRET = process.env.JWT_SECRET || "SEVEN_SQUARE"
        const decoded = jwt.verify(token, JWT_SECRET);
        console.log(decoded);

        if (!decoded || typeof decoded !== "object" || !("_id" in decoded)) {
            console.log("Invalid token");
            return res.status(403).json({ message: "Invalid token" });
        }
        
        const user = await UserModel.findOne({_id: decoded._id});
        console.log(user);

        if(!user){
           return res.status(404).json({ message: "User not found"})
        }

         // Convert Mongoose document to plain object
         req.user = {
            _id: user._id as Types.ObjectId, // Explicit cast for TypeScript
            fullName: user.fullName,
            username: user.username,
            profilePic: user.profilePic,
            email: user.email,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
        
        next();
    } catch (error) {
        res.status(500).json({
            message: `Server side issue ${error}`
        })
    }
}