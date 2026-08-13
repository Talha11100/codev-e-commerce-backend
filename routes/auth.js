const express = require("express")
const jwt = require("jsonwebtoken")
const bcrypt = require("bcrypt")
const Users = require("../models/auth")
const { getRandomId } = require("../config/global")
const { verifyToken } = require("../middlewares/auth")

const router = express.Router()

router.post("/register", async (req, res) => {

    try {
        const { fullName, email, password } = req.body

        const user = await Users.findOne({ email })
        if (user) { return res.status(401).json({ message: "User already exists", isError: true }) }

        const hashedPassword = await bcrypt.hash(password, 10)
        const uid = getRandomId()
        const newUserData = { uid, fullName, email, password: hashedPassword }

        const newUser = Users(newUserData)
        await newUser.save()

        res.status(201).json({ message: "A new user has been successfully registered", newUser })
    }

    catch (error) {
        console.error(error)
        res.status(500).json({ message: "Internal server error", isError: true })
    }

})


router.post("/login", async (req, res) => {

    try {

        const { email, password } = req.body
        const user = await Users.findOne({ email })

        if (!user) { return res.status(401).json({ message: "Invalid email or password", isError: true }) }

        if (user.status === "inactive") { return res.status(401).json({ message: "Your account is inactive", isError: true }) }


        const match = await bcrypt.compare(password, user.password)

        if (match) {

            const { uid } = user
            const token = await jwt.sign({ uid }, process.env.JWT_SECRET, { expiresIn: "1d" })
            res.status(201).json({ message: "Login successful", token })

        } else {
            res.status(401).json({ message: "Invalid email or password", isError: true })
        }
    }

    catch (error) {
        console.error(error)
        res.status(500).json({ message: "Internal server error", isError: true })
    }

})

router.get("/user", verifyToken, async (req, res) => {

    try {
        const { uid } = req
        const user = await Users.findOne({ uid })

        if (!user) {
            return res.status(401).json({ message: "User not found", isError: true })
        }
        else {
            return res.status(200).json({ message: "User found", user })
        }
    }
    catch (error) {
        console.error(error)
        res.status(500).json({ message: "Internal server error", isError: true })
    }

})

router.get("/users", verifyToken, async (req, res) => {

    try {
        const { uid } = req
        const user = await Users.findOne({ uid })

        if (!user || user.role !== "superAdmin") {
            return res.status(401).json({ message: "Unauthorized", isError: true })
        }
        else {
            const users = await Users.find().select("-password").exec()
            return res.status(200).json({ message: "Users found", users })
        }
    }
    catch (error) {
        console.error(error)
        res.status(500).json({ message: "Internal server error", isError: true })
    }

})

router.get("/single/user/:_id", verifyToken, async (req, res) => {
    try {
        const { uid } = req
        const user = await Users.findOne({ uid })

        if (!user || user.role !== "superAdmin") { return res.status(401).json({ message: "Unauthorized", isError: true }) }

        const { _id } = req.params
        const singleUser = await Users.findOne({ _id })
        if (!singleUser) {
            return res.status(404).json({ message: "User not fetched", isError: true })
        }
        else {
            return res.status(200).json({ message: "User fetched successfully", singleUser })
        }

    }
    catch (error) {
        console.error(error)
        res.status(500).json({ message: "Internal server error", isError: true })
    }
})

router.delete("/delete-user-by-admin/:_id", verifyToken, async (req, res) => {
    try {
        const { uid } = req
        const user = await Users.findOne({ uid })

        if (!user || user.role !== "superAdmin") { return res.status(401).json({ message: "Unauthorized", isError: true }) }

        const { _id } = req.params
        const deletedUser = await Users.deleteOne({ _id })

        if (!deletedUser) {
            return res.status(404).json({ message: "User not deleted", isError: true })
        }
        else {
            return res.status(200).json({ message: "User deleted successfully", deletedUser })
        }
    }
    catch (error) {
        console.error(error)
        res.status(500).json({ message: "Internal server error", isError: true })
    }
})

router.patch("/update-user-by-admin/:_id", verifyToken, async (req, res) => {
    try {
        const { uid } = req
        const user = await Users.findOne({ uid })

        if (!user || user.role !== "superAdmin") { return res.status(401).json({ message: "Unauthorized", isError: true }) }

        const { _id } = req.params
        const { fullName, role, status } = req.body
        const updatedUser = await Users.findOneAndUpdate({ _id }, { fullName, role, status }, { returnDocument: "after" })

        if (!updatedUser) {
            return res.status(404).json({ message: "User not updated", isError: true })
        }
        else {
            return res.status(200).json({ message: "User updated successfully", updatedUser })
        }
    }
    catch (error) {
        console.error(error)
        res.status(500).json({ message: "Internal server error", isError: true })
    }
})



module.exports = router