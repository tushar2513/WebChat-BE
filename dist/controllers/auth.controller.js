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
exports.checkAuth = exports.updateUserProfile = exports.logout = exports.login = exports.signup = void 0;
const zod_1 = require("zod");
const user_model_1 = require("../models/user.model");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
const cloudinary_1 = __importDefault(require("../lib/cloudinary"));
dotenv_1.default.config();
const signup = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log("Received body:", req.body);
        const userInput = zod_1.z.object({
            fullName: zod_1.z.string().min(3).max(20),
            username: zod_1.z.string().min(3).max(20),
            password: zod_1.z.string()
                .min(6)
                .max(20)
                .regex(/[A-Za-z]/, "Password must contain at least one letter")
                .regex(/\d/, "Password must contain at least one digit")
                .regex(/[\W_]/, "Password must contain at least one special character"),
            email: zod_1.z.string().email(),
        });
        const parsedUSerInput = userInput.safeParse(req.body);
        if (!parsedUSerInput.success) {
            console.log("Signup route hit");
            return res.status(400).json({
                message: "Bad request",
                error: parsedUSerInput.error.errors.map(err => err.message)
            });
        }
        const { username, password, email, fullName } = req.body;
        const response = yield user_model_1.UserModel.findOne({ email });
        if (response) {
            return res.status(409).json({
                message: "User Already exists"
            });
        }
        const hashedPassword = yield bcryptjs_1.default.hash(password, 10);
        const user = yield user_model_1.UserModel.create({
            username: username,
            password: hashedPassword,
            email: email,
            fullName: fullName,
        });
        if (!user) {
            return res.status(403).json({
                message: "User sign up failed"
            });
        }
        res.status(201).json({
            message: "User signed up successfully",
        });
    }
    catch (error) {
        res.status(500).json({
            message: `Server side issue: ${error}`,
        });
    }
});
exports.signup = signup;
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userInput = zod_1.z.object({
            identifier: zod_1.z.string().min(3).max(20),
            password: zod_1.z.string()
                .min(3)
                .max(20)
                .regex(/[A-Za-z]/, "Password must contain at least one letter")
                .regex(/\d/, "Password must contain at least one digit")
                .regex(/[\W_]/, "Password must contain at least one special character"),
        });
        const parsedUSerInput = userInput.safeParse(req.body);
        if (!parsedUSerInput.success) {
            return res.status(400).json({
                message: "Bad request",
                error: parsedUSerInput.error.errors.map(err => err.message)
            });
        }
        const { identifier, password } = req.body;
        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
        const user = yield user_model_1.UserModel.findOne(isEmail ? { email: identifier } : { username: identifier });
        if (!user) {
            return res.status(403).json({
                message: "Incorrect credantials"
            });
        }
        const passwordMatch = yield bcryptjs_1.default.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(403).json({
                message: "Incorrect Password"
            });
        }
        //new JWT way with cookie
        const JWT_SECRET = process.env.JWT_SECRET || "NEGATIV_SECRET";
        const token = jsonwebtoken_1.default.sign({ _id: user._id.toString() }, JWT_SECRET, { expiresIn: "7d" });
        res.status(200).cookie("jwt", token, {
            maxAge: 7 * 24 * 60 * 60 * 1000,
            httpOnly: true,
            sameSite: "strict",
            secure: process.env.NODE_ENV !== "development"
        }).json({
            message: "Logged In successfully",
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
            },
        });
    }
    catch (error) {
        res.status(500).json({
            message: `Serer side issue ${error}`
        });
    }
});
exports.login = login;
const logout = (req, res) => {
    try {
        res.cookie('jwt', "", { maxAge: 0 });
        res.status(200).json({
            message: "Logged out successfully"
        });
    }
    catch (error) {
        res.status(200).json({
            message: `Server side issue ${error}`
        });
    }
};
exports.logout = logout;
const updateUserProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { profilePic, fullName, username, email } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        console.log("this is req body", req.body);
        console.log(profilePic);
        console.log(fullName);
        console.log(username);
        if (!profilePic && !fullName && !username) {
            return res.status(400).json({ message: "At least one field (profilePic, fullName, or username) is required." });
        }
        const updateData = {};
        if (profilePic) {
            try {
                const uploadResponse = yield cloudinary_1.default.uploader.upload(profilePic);
                updateData.profilePic = uploadResponse.secure_url;
            }
            catch (error) {
                return res.status(500).json({ message: "Failed to upload profile picture." });
            }
        }
        if (fullName) {
            updateData.fullName = fullName;
        }
        // if (username) {
        //     const existingUser = await UserModel.findOne({ username });
        //     if (existingUser && existingUser._id.toString() !== userId?.toString()) {
        //         return res.status(400).json({ message: "Username is already taken." });
        //     }
        //     else {
        //         updateData.username = username;
        //         const updatedUser = await UserModel.findByIdAndUpdate(userId, updateData, { new: true });
        //         return res.status(200).json({
        //             updatedUser,
        //         });
        //     }
        // }
        if (username) {
            const existingUser = yield user_model_1.UserModel.findOne({ username });
            if (existingUser && existingUser._id.toString() !== (userId === null || userId === void 0 ? void 0 : userId.toString())) {
                return res.status(400).json({ message: "Username is already taken." });
            }
            updateData.username = username;
        }
        const updatedUser = yield user_model_1.UserModel.findByIdAndUpdate(userId, updateData, { new: true });
        if (!updatedUser) {
            return res.status(404).json({ message: "User not found." });
        }
        return res.status(200).json({
            // message: "Profile updated successfully.",
            updatedUser,
        });
    }
    catch (error) {
        return res.status(500).json({
            message: `Server side issue: ${error}`,
        });
    }
});
exports.updateUserProfile = updateUserProfile;
const checkAuth = (req, res) => {
    try {
        res.status(200).json(req.user);
        console.log("from checkAuth controller:", req.user);
    }
    catch (error) {
        console.log("Error in checkAuth controller", error);
        res.status(500).json({
            message: "Internal Server Error"
        });
    }
};
exports.checkAuth = checkAuth;
// export const updateUserProfile = async (req: CustomRequest, res: Response): Promise<any> => {
//     try {
//         const { profilePic, username, fullName } = req.body;
//         const userId = req.userId;
//         if (!profilePic && !fullName && !username) {
//             return res.status(400).json({ message: "At least one field (profilePic, fullName, or username) is required." });
//         }
//         const updateData: { profilePic?: string; username?: string; fullName?: string } = {};
//         if (profilePic) {
//             const uploadResponse = await cloudinary.uploader.upload(profilePic);
//             const updateData = uploadResponse.secure_url;
//         }
//         if(username){
//             const existingUser = await UserModel.findOne({ username });
//             if(existingUser && existingUser._id.toString() !== userId ){
//                 return res.status(400).json({ message : "Username is Taken" })
//             }
//             updateData.username = username;
//         }
//         if(fullName){
//             updateData.fullName = fullName;
//         }
//         const updatedData = await UserModel.findByIdAndUpdate(userId, updateData, {new : true});
//         res.status(200).json({
//             updatedData,
//         })
//     } catch (error) {
//         res.status(500).json({
//             message: `Server side issue ${error}`
//         })
//     }
// };
