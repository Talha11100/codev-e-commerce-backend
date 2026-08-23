const express = require("express")
const jwt = require("jsonwebtoken")
const bcrypt = require("bcrypt")
const Users = require("../models/auth")
const { getRandomId } = require("../config/global")
const { verifyToken } = require("../middlewares/auth")
const { transporter } = require("../config/nodemailer")

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

        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: email,
            subject: "Registration successful",
            text: `Welcome to our platform ${fullName}. Your registration has been successful by using this email id: ${email} and you can now login with the email id and password used for registration`,
        }

        await transporter.sendMail(mailOptions)

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


router.post("/forgot-password", async (req, res) => {
    try {
        const { email } = req.body
        if (!email) { return res.status(400).json({ message: "Email is required", isError: true }) }

        const user = await Users.findOne({ email })
        if (!user) { return res.status(404).json({ message: "User not found", isError: true }) }

        const otp = Math.floor(100000 + Math.random() * 900000).toString()
        user.resetOtp = otp
        user.resetOtpExpireAt = Date.now() + 10 * 60 * 1000
        await user.save()
        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: email,
            subject: "Password reset",
            html: `
            <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset OTP</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f7f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f7f6; padding: 40px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 480px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
          <!-- Header -->
          <tr>
            <td style="background-color: #4f46e5; padding: 28px 24px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: 0.5px;">Security Verification</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 32px 24px; text-align: center; color: #334155;">
              <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.5; color: #475569;">
                We received a request to reset your password. Use the verification code below to proceed:
              </p>
              
              <!-- OTP Display Box -->
              <div style="margin: 24px 0; background-color: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 8px; padding: 16px 0;">
                <span style="font-family: 'Courier New', Courier, monospace; font-size: 34px; font-weight: 700; letter-spacing: 8px; color: #4f46e5;">${otp}</span>
              </div>
              
              <p style="margin: 0 0 8px 0; font-size: 13px; color: #64748b;">
                This code will expire in <strong>10 minutes</strong>.
              </p>
              <p style="margin: 0; font-size: 13px; color: #94a3b8;">
                If you did not request a password reset, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 16px 24px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                &copy; ${new Date().getFullYear()}. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
            `
        }
        await transporter.sendMail(mailOptions)
        res.status(200).json({ message: "OTP sent successfully" })
    }
    catch (error) {
        console.error(error)
        res.status(500).json({ message: "Internal server error", isError: true })
    }
})


router.post("/verify-otp", async (req, res) => {
    try {
        const { email, otp } = req.body
        if (!email || !otp) { return res.status(400).json({ message: "Email and OTP are required", isError: true }) }
        const user = await Users.findOne({ email })
        if (!user) { return res.status(404).json({ message: "User not found", isError: true }) }
        if (user.resetOtp !== otp) { return res.status(401).json({ message: "Invalid OTP", isError: true }) }
        if (user.resetOtpExpireAt < Date.now()) { return res.status(401).json({ message: "OTP has expired", isError: true }) }
        res.status(200).json({ message: "OTP verified successfully" })
    }
    catch (error) {
        console.error(error)
        res.status(500).json({ message: "Internal server error", isError: true })
    }
})

router.post("/reset-password", async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body
        if (!email || !otp || !newPassword) { return res.status(400).json({ message: "All fields are required", isError: true }) }
        const user = await Users.findOne({ email })
        if (!user) { return res.status(404).json({ message: "User not found", isError: true }) }
        if (user.resetOtp !== otp) { return res.status(401).json({ message: "Invalid OTP", isError: true }) }
        if (user.resetOtpExpireAt < Date.now()) { return res.status(401).json({ message: "OTP has expired", isError: true }) }
        const hashedPassword = await bcrypt.hash(newPassword, 10)
        user.password = hashedPassword
        user.resetOtp = ""
        user.resetOtpExpireAt = 0
        await user.save()
        res.status(200).json({ message: "Password reset successful" })
    }
    catch (error) {
        console.error(error)
        res.status(500).json({ message: "Internal server error", isError: true })
    }
})

module.exports = router