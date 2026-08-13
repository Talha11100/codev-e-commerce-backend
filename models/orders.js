const mongoose = require("mongoose")

const { Schema, model } = mongoose

const schema = new Schema({
    id: { type: String, unique: true, required: true },
    uid: { type: String, required: true },
    products: [{
        productId: { type: String, required: true },
        name: { type: String, required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true }
    }],
    totalAmount: { type: Number, required: true },
    shippingAddress: { type: String, required: false },
    status: { type: String, required: true, enum: ["pending", "processing", "shipped", "delivered", "cancelled"], default: "pending" },
    paymentStatus: { type: String, required: true, enum: ["pending", "paid", "failed"], default: "pending" },
}, { timestamps: true })

const Orders = model("orders", schema)

module.exports = Orders
