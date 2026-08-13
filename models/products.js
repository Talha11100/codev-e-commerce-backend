const mongoose = require("mongoose")

const { Schema, model } = mongoose

const schema = new Schema({
    id: { type: String, unique: true, required: true },
    uid: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    stock: { type: Number, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    status: { type: String, required: true, enum: ["active", "inactive"], default: "active" },
    imageURL: { type: String, required: true },
    imagePublicId: { type: String, required: true },
}, { timestamps: true })

const Products = model("products", schema)

module.exports = Products