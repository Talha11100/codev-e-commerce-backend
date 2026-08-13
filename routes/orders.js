const express = require("express")
const Orders = require("../models/orders")
const Users = require("../models/auth")
const { getRandomId } = require("../config/global")
const { verifyToken } = require("../middlewares/auth")
const Products = require("../models/products")
const router = express.Router()


router.post("/create", verifyToken, async (req, res) => {

    try {
        const { uid } = req
        const user = await Users.findOne({ uid })
        if (!user || user.role !== "customer") { return res.status(401).json({ message: "You are not authorized to create an order", isError: true }) }

        const { products, totalAmount, shippingAddress } = req.body

        const id = getRandomId()

        const newOrder = new Orders({ id, uid, products, totalAmount, shippingAddress })
        await newOrder.save()

        const updatedProducts = await Promise.all(
            products.map(product =>
                Products.findOneAndUpdate(
                    { id: product.productId },
                    { $inc: { stock: -product.quantity } },
                    { returnDocument: "after" }
                )
            )
        );

        return res.status(201).json({ message: "Order created successfully", newOrder, updatedProducts })
    }
    catch (error) {
        console.error(error)
        return res.status(500).json({ message: "Internal server error", isError: true })
    }
})

router.get("/all", verifyToken, async (req, res) => {

    try {
        const { uid } = req
        const user = await Users.findOne({ uid })

        if (!user) { return res.status(401).json({ message: "You are not authorized to get orders", isError: true }) }

        let orders = []

        if (user.role === "superAdmin") {
            orders = await Orders.find()
        } else {
            orders = await Orders.find({ uid })
        }

        return res.status(200).json({ message: "Orders fetched successfully", orders })
    }
    catch (error) {
        console.error(error)
        return res.status(500).json({ message: "Internal server error", isError: true })
    }

})

router.get("/single/:id", verifyToken, async (req, res) => {
    try {

        const { uid } = req
        const user = await Users.findOne({ uid })

        if (!user || user.role !== "superAdmin") { return res.status(401).json({ message: "You are not authorized to get orders", isError: true }) }

        const { id } = req.params

        const order = await Orders.findOne({ id })
        if (!order) { return res.status(404).json({ message: "Order not found", isError: true }) }

        return res.status(200).json({ message: "Order fetched successfully", order })
    }
    catch (error) {
        console.error(error)
        return res.status(500).json({ message: "Internal server error", isError: true })
    }
})

router.patch("/update/:id", verifyToken, async (req, res) => {
    try {

        const { uid } = req
        const user = await Users.findOne({ uid })

        if (!user || user.role !== "superAdmin") { return res.status(401).json({ message: "You are not authorized to update an order", isError: true }) }

        const { id } = req.params
        const { status } = req.body

        const order = await Orders.findOne({ id })
        if (!order) { return res.status(404).json({ message: "Order not found", isError: true }) }

        const updatedOrder = await Orders.findOneAndUpdate({ id }, { status }, { returnDocument: "after" })
        if (!updatedOrder) { return res.status(400).json({ message: "Order not updated", isError: true }) }

        return res.status(200).json({ message: "Order updated successfully", updatedOrder })
    }
    catch (error) {
        console.error(error)
        return res.status(500).json({ message: "Internal server error", isError: true })
    }
})

router.delete("/delete/:id", verifyToken, async (req, res) => {
    try {
        const { uid } = req
        const user = await Users.findOne({ uid })
        if (!user || user.role !== "superAdmin") { return res.status(401).json({ message: "You are not authorized to delete an order", isError: true }) }

        const { id } = req.params

        const order = await Orders.findOne({ id })
        if (!order) { return res.status(404).json({ message: "Order not found", isError: true }) }

        const deletedOrder = await Orders.findOneAndDelete({ id })
        if (!deletedOrder) { return res.status(400).json({ message: "Order not deleted", isError: true }) }

        return res.status(200).json({ message: "Order deleted successfully", deletedOrder })
    }
    catch (error) {
        console.error(error)
        return res.status(500).json({ message: "Internal server error", isError: true })
    }
})


module.exports = router