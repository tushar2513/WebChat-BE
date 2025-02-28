import mongoose from "mongoose";

export const connectDB = async () => {
    try {
        const mongoUrl = process.env.MONGO_URL;

        if (!mongoUrl) {
            throw new Error("MONGO_URL is not defined in environment variables.");
        }

        const connect = await mongoose.connect(mongoUrl)

        console.log("Connected to Db")
    } catch (error) {
        console.log("Failed to connect Db",error)
    }
}