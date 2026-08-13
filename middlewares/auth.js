const jwt = require("jsonwebtoken")

const verifyToken = (req, res, next) => {

    const authHeader = req?.headers?.authorization
    const token = authHeader?.split(" ")[1]

    if (!token) { return res.status(404).json({ message: "Unauthorized or access token missing", isError: true }) }

    jwt.verify(token, process.env.JWT_SECRET, (error, result) => {

        if (!error) {
            req.uid = result.uid
            next()
        } else {
            console.error(error)
            return res.status(404).json({ message: "Unauthorized or user doesn't have access", isError: true })
        }
    })
}

module.exports = { verifyToken }