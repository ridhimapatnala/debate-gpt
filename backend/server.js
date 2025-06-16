require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')

const app = express()
const PORT = process.env.PORT || 5000;

// middleware
app.use(cors())
app.use(express.json())

// routes
const debateRoutes = require("./routes/debateRoutes")
const authRoutes=require('./routes/AuthRoutes')
app.use('/api/debates', debateRoutes)
app.use('/api', authRoutes)
// connecting to MongoDB 
mongoose.connect(process.env.MONGO_URI)
    .then(()=>console.log("MongoDB connection successful"))
    .then(()=>{
        app.listen(PORT, ()=>console.log(`Server running on port ${PORT}`))
    })
    .catch((e)=>console.log("MongoDB connection error:", e))
