// postSchema.js
import { Schema, model } from "mongoose";

const postSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  type: { type: String, enum: ["text", "image", "video", "link"], default: "text" },
  content: String,
  imageUrl: String,
  videoUrl: String,
  linkUrl: String,
  likes: [{ type: Schema.Types.ObjectId, ref: "User" }],
  comments: [{
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }]
});

const Post = model("Post", postSchema);

export default Post;
