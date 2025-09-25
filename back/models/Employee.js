import mongoose from "mongoose";
export default mongoose.model("Employee", new mongoose.Schema({
  id: String,
  access_level: Number,
  request_time: String,
  room: String
}));
