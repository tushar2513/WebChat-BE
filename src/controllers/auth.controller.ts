import { Request, Response } from "express";
import { z } from "zod";
import { UserModel } from "../models/user.model";
import bcryptjs from 'bcryptjs';
import jwt from "jsonwebtoken";
import dotenv from 'dotenv';
import { CustomRequest } from "../middleware/auth.middleware";
import cloudinary from "../lib/cloudinary";

dotenv.config();

export const signup = async (req: Request, res: Response): Promise<any> => {
    try {
        console.log("Received body:", req.body);
        const userInput = z.object({
            fullName: z.string().min(3).max(20),
            username: z.string().min(3).max(20),
            password: z.string()
                .min(6)
                .max(20)
                .regex(/[A-Za-z]/, "Password must contain at least one letter")
                .regex(/\d/, "Password must contain at least one digit")
                .regex(/[\W_]/, "Password must contain at least one special character"),
            email: z.string().email(),
        })

        const parsedUSerInput = userInput.safeParse(req.body);

        if (!parsedUSerInput.success) {
            console.log("Signup route hit");
            return res.status(400).json({
                message: "Bad request",
                
                error: parsedUSerInput.error.errors.map(err => err.message)
            })
        }

        const { username, password, email, fullName } = req.body;

        const response = await UserModel.findOne({ email });

        if (response) {
            return res.status(409).json({
                message: "User Already exists"
            })
        }

        const hashedPassword = await bcryptjs.hash(password, 10);

        const user = await UserModel.create({
            username: username,
            password: hashedPassword,
            email: email,
            fullName: fullName,
        })

        if (!user) {
            return res.status(403).json({
                message: "User sign up failed"
            })
        }

        res.status(201).json({
            message: "User signed up successfully",
        });

    } catch (error) {
        res.status(500).json({
            message: `Server side issue: ${error}`,
        });
    }
};


export const login = async (req: Request, res: Response): Promise<any> => {
    try {
        const userInput = z.object({
            identifier: z.string().min(3).max(20),
            password: z.string()
                .min(3)
                .max(20)
                .regex(/[A-Za-z]/, "Password must contain at least one letter")
                .regex(/\d/, "Password must contain at least one digit")
                .regex(/[\W_]/, "Password must contain at least one special character"),
        })

        const parsedUSerInput = userInput.safeParse(req.body);

        if (!parsedUSerInput.success) {
            return res.status(400).json({
                message: "Bad request",
                error: parsedUSerInput.error.errors.map(err => err.message)
            })
        }

        const { identifier, password } = req.body;

        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);

        const user = await UserModel.findOne(isEmail ? { email: identifier } : { username: identifier });

        if (!user) {
            return res.status(403).json({
                message: "Incorrect credantials"
            })
        }

        const passwordMatch = await bcryptjs.compare(password, user.password);

        if (!passwordMatch) {
            return res.status(403).json({
                message: "Incorrect Password"
            })
        }

        //new JWT way with cookie
        const JWT_SECRET = process.env.JWT_SECRET || "NEGATIV_SECRET";
        const token = jwt.sign({ _id: user._id.toString() }, JWT_SECRET, { expiresIn: "7d" });

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

    } catch (error) {
        res.status(500).json({
            message: `Serer side issue ${error}`
        })
    }
};


export const logout = (req: Request, res: Response) => {
    try {
        res.cookie('jwt', "", { maxAge: 0 })

        res.status(200).json({
            message: "Logged out successfully"
        })
    } catch (error) {
        res.status(200).json({
            message: `Server side issue ${error}`
        })
    }
};


export const updateUserProfile = async (req: CustomRequest, res: Response): Promise<any> => {
    try {
        const { profilePic, fullName, username, email } = req.body;
        const userId = req.user?._id;

        console.log("this is req body", req.body)
        console.log(profilePic);
        console.log(fullName);
        console.log(username);

        if (!profilePic && !fullName && !username) {
            return res.status(400).json({ message: "At least one field (profilePic, fullName, or username) is required." });
        }

        const updateData: { profilePic?: string; fullName?: string; username?: string; } = {};

        if (profilePic) {
            try {
                const uploadResponse = await cloudinary.uploader.upload(profilePic);
                updateData.profilePic = uploadResponse.secure_url;
            } catch (error) {
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
            const existingUser = await UserModel.findOne({ username });
            if (existingUser && existingUser._id.toString() !== userId?.toString()) {
                return res.status(400).json({ message: "Username is already taken." });
            }
            updateData.username = username;
        }

        const updatedUser = await UserModel.findByIdAndUpdate(userId, updateData, { new: true });
        if (!updatedUser) {
            return res.status(404).json({ message: "User not found." });
        }

        return res.status(200).json({
            // message: "Profile updated successfully.",
            updatedUser,
        });

    } catch (error) {
        return res.status(500).json({
            message: `Server side issue: ${error}`,
        });
    }
};


export const checkAuth = (req: CustomRequest, res: Response) => {
    try {
        res.status(200).json(req.user);
        console.log("from checkAuth controller:", req.user)
    } catch (error) {
        console.log("Error in checkAuth controller", error)
        res.status(500).json({
            message: "Internal Server Error"
        })
    }
}



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





