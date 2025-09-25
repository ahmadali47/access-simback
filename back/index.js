import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

import './db.js'
import Employee from './models/Employee.js';

dotenv.config();

const app = express();

app.use(cors({
  origin: `${process.env.FRONT_URL}`, 
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));


app.use(express.json());



const rooms = {
  ServerRoom: { min: 2, open: "09:00", close: "11:00", cooldown: 15 },
  Vault:      { min: 3, open: "09:00", close: "10:00", cooldown: 30 },
  "R&D Lab":  { min: 1, open: "08:00", close: "12:00", cooldown: 10 }
};

function toMinutes(time) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}


// routes 
app.get("/api/access", async (req, res) => {
  const list = await Employee.find();
  res.json(list);
});


app.post("/api/access/simulate", async (req, res) => {
  const employees = await Employee.find();
  const lastAccess = {}; // track last access time per employee/room

  const results = employees.map(emp => {
    const r = rooms[emp.room];
    const reqMin = toMinutes(emp.request_time);
    if (!r) return { id: emp.id, status: "Denied", reason: "Room not found" };
    if (emp.access_level < r.min)
      return { id: emp.id, status: "Denied", reason: "Below required level" };
    if (reqMin < toMinutes(r.open) || reqMin > toMinutes(r.close))
      return { id: emp.id, status: "Denied", reason: "Room closed" };

    const key = `${emp.id}_${emp.room}`;
    if (lastAccess[key] && reqMin - lastAccess[key] < r.cooldown)
      return { id: emp.id, status: "Denied", reason: "Cooldown active" };

    lastAccess[key] = reqMin;
    return { id: emp.id, status: "Granted", reason: `Access granted to ${emp.room}` };
  });

  res.json(results);
});


// --- Start server ---
const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Backend running on ${port}`));
