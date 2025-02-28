import { getReceiverSocketId, io } from "../lib/socket";
import { CustomRequest } from "../middleware/auth.middleware"
import { MessageModel } from "../models/message.model";
import { UserModel } from "../models/user.model";
import { Response, Request } from "express";
import cloudinary from "../lib/cloudinary";

export const getUserSidebar = async (req: CustomRequest, res: Response): Promise<any> => {
    try {
        const loggedInUserId = req.user?._id;
        const filteredUsers = await UserModel.find({_id: {$ne:loggedInUserId}}).select('-password');

        res.status(200).json({
            filteredUsers,
        })

    } catch (error) {
        console.log("Error in fetcing Users in SideBar",error);
        res.status(500).json({ error: `Server side issue`});
    }
}

export const getMessages = async (req: CustomRequest, res: Response): Promise<any> => {
    try {
        const {id : userToChatId} = req.params
        const myId = req.user?._id;

        const messages = await MessageModel.find({
            $or:[
                {senderId: myId, receiverId: userToChatId},
                {senderId: userToChatId, receiverId: myId}
            ]
        })

        res.status(200).json(messages);
    } catch (error) {
        console.log("Error while fetching messages",error);
        res.status(500).json({
            error: `Server side issue`
        })
    }
}

export const sendMessage = async (req: CustomRequest, res: Response): Promise<any> => {
    try {
        const { text, image } = req.body;
        const { id: receiverId } = req.params;
        const senderId = req.user?._id;

        console.log("From BE senderId",senderId);
        console.log("From BE receiverId",receiverId);
        console.log("User from BE",req.body);

        let imageUrl;

        if(image){
            const uploadResponse = await cloudinary.uploader.upload(image);
            const imageUrl = uploadResponse.secure_url;

            const newMessage = new MessageModel({
                senderId,
                receiverId,
                image: imageUrl,
                text,
            });

            await newMessage.save();

            const receiverSocketId = getReceiverSocketId(receiverId);
            if(receiverSocketId) {
                io.to(receiverSocketId).emit("newMessage",newMessage);
            }

            res.status(201).json(newMessage);
        }else{
            const newMessage = new MessageModel({
                senderId,
                receiverId,
                text,
            });
    
            await newMessage.save();

            //realTime functionality goes here => socket.io
            const receiverSocketId = getReceiverSocketId(receiverId);
            if(receiverSocketId) {
                io.to(receiverSocketId).emit("newMessage",newMessage);
            }

            res.status(201).json(newMessage);
        }

        
        

    } catch (error) {
        console.log("Error while sending message",error);
        res.status(500).json({
            error: "Server side issue"
        })
    }
}
