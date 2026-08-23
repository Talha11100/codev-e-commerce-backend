const mongoose = require("mongoose")

const { Schema, model } = mongoose

const schema = new Schema({
    uid: { type: String, unique: true, required: true },
    fullName: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    resetOtp: { type: String, default: "" },
    resetOtpExpireAt: { type: Number, default: 0 },
    role: { type: String, enum: ["customer", "superAdmin"], default: "customer" },
    status: { type: String, enum: ["active", "inactive"], default: "active" }
}, { timestamps: true });

const Users = model("users", schema)

module.exports = Users