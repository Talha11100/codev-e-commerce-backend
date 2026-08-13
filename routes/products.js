const express = require("express")
const { verifyToken } = require("../middlewares/auth")
const Users = require("../models/auth")
const { getRandomId } = require("../config/global")
const Products = require("../models/products")
const cloudinary = require("../config/cloudinary")
const multer = require("multer")

const storage = multer.memoryStorage()
const upload = multer({ storage })

const router = express.Router()

router.post("/create", verifyToken, upload.fields([{ name: "image" }]), async (req, res) => {

    try {
        const { uid } = req
        const user = await Users.findOne({ uid })

        if (!user || user.role !== "superAdmin") { return res.status(401).json({ message: "Unauthorized", isError: true }) }

        const formData = req.body

        let imageURL = "", imagePublicId = ""
        if (req.files["image"] && req.files["image"][0]) {
            await new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    { folder: "mystore/products/images/" },
                    (error, result) => {
                        if (error) { reject(error) }
                        else {
                            imageURL = result.secure_url
                            imagePublicId = result.public_id
                            resolve()
                        }
                    }
                )
                uploadStream.end(req.files["image"][0].buffer)
            })
        }

        const { name, price, stock, category, description } = formData
        if (name === "" || price === "" || stock === "" || category === "" || description === "") { return res.status(400).json({ message: "All fields are required", isError: true }) }
        const id = getRandomId()

        const productData = { id, uid, name, price, stock, category, description, imageURL, imagePublicId }
        const newProduct = new Products(productData)
        await newProduct.save()

        return res.status(201).json({ message: "A new product has been created successfully", newProduct })

    }
    catch (error) {
        console.error(error)
        res.status(500).json({ message: "Internal server error", isError: true })
    }
})


router.get("/all", verifyToken, async (req, res) => {

    try {
        const { uid } = req
        const user = await Users.findOne({ uid })

        if (!user || user.role !== "superAdmin") { return res.status(401).json({ message: "Unauthorized", isError: true }) }

        const products = await Products.find()

        return res.status(200).json({ message: "Products fetched successfully", products })
    }
    catch (error) {
        console.error(error)
        res.status(500).json({ message: "Internal server error", isError: true })
    }
})


router.get("/public-all", async (req, res) => {

    try {
        const products = await Products.find({ status: "active" })

        return res.status(200).json({ message: "Public Products fetched successfully", products })
    }
    catch (error) {
        console.error(error)
        res.status(500).json({ message: "Internal server error", isError: true })
    }

})


router.delete("/delete/:id", verifyToken, async (req, res) => {
    try {
        const { uid } = req
        const user = await Users.findOne({ uid })

        if (!user || user.role !== "superAdmin") { return res.status(401).json({ message: "Unauthorized", isError: true }) }

        const { id } = req.params

        const product = await Products.findOne({ id })

        if (!product) { return res.status(404).json({ message: "Product not found", isError: true }) }

        await cloudinary.uploader.destroy(product.imagePublicId)

        const deletedProduct = await Products.findOneAndDelete({ id })

        return res.status(200).json({ message: "Product deleted successfully", deletedProduct })
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

        if (!user || user.role !== "superAdmin") { return res.status(401).json({ message: "Unauthorized", isError: true }) }

        const { id } = req.params
        const product = await Products.findOne({ id })

        if (!product) { return res.status(404).json({ message: "Product not found", isError: true }) }

        return res.status(200).json({ message: "Product fetched successfully", product })
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

        if (!user || user.role !== "superAdmin") { return res.status(401).json({ message: "Unauthorized", isError: true }) }

        const { id } = req.params
        const product = await Products.findOne({ id })
        if (!product) { return res.status(404).json({ message: "Product not found", isError: true }) }

        const { name, price, stock, category, description, status } = req.body

        const updatedProduct = await Products.findOneAndUpdate({ id }, { uid, name, price, stock, category, description, status }, { returnDocument: "after" })

        return res.status(200).json({ message: "Product updated successfully", updatedProduct })
    }
    catch (error) {
        console.error(error)
        return res.status(500).json({ message: "Internal server error", isError: true })
    }
})

module.exports = router