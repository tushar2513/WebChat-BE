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
exports.sendMessage = exports.getMessages = exports.getUserSidebar = void 0;
const socket_1 = require("../lib/socket");
const message_model_1 = require("../models/message.model");
const user_model_1 = require("../models/user.model");
const cloudinary_1 = __importDefault(require("../lib/cloudinary"));
const getUserSidebar = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const loggedInUserId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const filteredUsers = yield user_model_1.UserModel.find({ _id: { $ne: loggedInUserId } }).select('-password');
        res.status(200).json({
            filteredUsers,
        });
    }
    catch (error) {
        console.log("Error in fetcing Users in SideBar", error);
        res.status(500).json({ error: `Server side issue` });
    }
});
exports.getUserSidebar = getUserSidebar;
const getMessages = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id: userToChatId } = req.params;
        const myId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const messages = yield message_model_1.MessageModel.find({
            $or: [
                { senderId: myId, receiverId: userToChatId },
                { senderId: userToChatId, receiverId: myId }
            ]
        });
        res.status(200).json(messages);
    }
    catch (error) {
        console.log("Error while fetching messages", error);
        res.status(500).json({
            error: `Server side issue`
        });
    }
});
exports.getMessages = getMessages;
const sendMessage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { text, image } = req.body;
        const { id: receiverId } = req.params;
        const senderId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        console.log("From BE senderId", senderId);
        console.log("From BE receiverId", receiverId);
        console.log("User from BE", req.body);
        let imageUrl;
        if (image) {
            const uploadResponse = yield cloudinary_1.default.uploader.upload(image);
            const imageUrl = uploadResponse.secure_url;
            const newMessage = new message_model_1.MessageModel({
                senderId,
                receiverId,
                image: imageUrl,
                text,
            });
            yield newMessage.save();
            const receiverSocketId = (0, socket_1.getReceiverSocketId)(receiverId);
            if (receiverSocketId) {
                socket_1.io.to(receiverSocketId).emit("newMessage", newMessage);
            }
            res.status(201).json(newMessage);
        }
        else {
            const newMessage = new message_model_1.MessageModel({
                senderId,
                receiverId,
                text,
            });
            yield newMessage.save();
            //realTime functionality goes here => socket.io
            const receiverSocketId = (0, socket_1.getReceiverSocketId)(receiverId);
            if (receiverSocketId) {
                socket_1.io.to(receiverSocketId).emit("newMessage", newMessage);
            }
            res.status(201).json(newMessage);
        }
    }
    catch (error) {
        console.log("Error while sending message", error);
        res.status(500).json({
            error: "Server side issue"
        });
    }
});
exports.sendMessage = sendMessage;
