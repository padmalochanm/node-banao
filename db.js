import mongoose from "mongoose";
import dotenv from 'dotenv';

dotenv.config();

const URI = process.env.MONGO_URI;
async function connectToDatabase() {
    try {
        await mongoose.connect(URI);
        console.log('Connected to MongoDB Atlas cluster:', mongoose.connection.name);
    } catch (error) {
        console.error('Error connecting to MongoDB Atlas:', error);
    }
}

export default connectToDatabase;