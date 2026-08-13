const mongoose = require("mongoose")

const connectDB = async () => {

    await mongoose.connect(`mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@cluster0.hohzzcw.mongodb.net/?appName=Cluster0`)
        .then(() => {
            console.log('MongoDB has been connected successfully')
        })
        .catch((error) => {
            console.error(error)
            console.log('MongoDB not connected')
        })
}

module.exports = { connectDB }


// talhaiftikhar1100_db_user
// Etrgx6RgnwuJ0H6m