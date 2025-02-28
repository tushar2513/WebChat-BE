"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageModel = void 0;
const mongoose_1 = require("mongoose");
const mongoose_2 = require("mongoose");
const messageSchema = new mongoose_2.Schema({
    senderId: {
        type: mongoose_2.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    receiverId: {
        type: mongoose_2.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    text: {
        type: String,
    },
    image: {
        type: String,
    }
}, { timestamps: true });
exports.MessageModel = (0, mongoose_1.model)("Message", messageSchema);
