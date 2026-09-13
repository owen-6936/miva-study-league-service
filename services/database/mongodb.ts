import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

 async function connectToDatabase() {
  const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error('MONGODB_URI is not defined in the environment variables');
}
   await mongoose.connect(uri)
     .then(() => console.log('Successfully connected to MongoDB'))
     .catch((err) => {
       console.error('Error connecting to MongoDB:', err)
       });
 }


export default connectToDatabase;