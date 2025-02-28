"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_model_1 = require("../models/user.model");
const authMiddleware = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const token = req.cookies.jwt;
        if (!token) {
            return res.status(401).json({ message: "Unauthorized: No token provided" });
        }
        const JWT_SECRET = process.env.JWT_SECRET || "SEVEN_SQUARE";
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        console.log(decoded);
        if (!decoded || typeof decoded !== "object" || !("_id" in decoded)) {
            console.log("Invalid token");
            return res.status(403).json({ message: "Invalid token" });
        }
        const user = yield user_model_1.UserModel.findOne({ _id: decoded._id });
        console.log(user);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        // Convert Mongoose document to plain object
        req.user = {
            _id: user._id, // Explicit cast for TypeScript
            fullName: user.fullName,
            username: user.username,
            profilePic: user.profilePic,
            email: user.email,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
        next();
    }
    catch (error) {
        res.status(500).json({
            message: `Server side issue ${error}`
        });
    }
});
exports.authMiddleware = authMiddleware;
