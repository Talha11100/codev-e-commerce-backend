require("dotenv").config()
const express = require("express")
const cors = require("cors")
const { connectDB } = require("./config/db")
const auth = require("./routes/auth")
const products = require("./routes/products")
const orders = require("./routes/orders")

const dns = require("dns")
dns.setServers(['1.1.1.1', '8.8.8.8'])

const app = express()

connectDB()

app.use(cors())
app.use(express.json())

app.use("/auth", auth)
app.use("/products", products)
app.use("/orders", orders)

const { PORT = 8000 } = process.env

app.listen(PORT, () => {
    console.log(`Server is running on PORT:${PORT}`)
})