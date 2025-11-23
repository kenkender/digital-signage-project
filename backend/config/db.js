// config/db.js
// ฟังก์ชันเชื่อมต่อ MongoDB


const mongoose = require('mongoose');


const connectDB = async () => {
try {
const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/digital_signage';


await mongoose.connect(uri, {
// options ปัจจุบันไม่จำเป็นต้องใส่แล้วใน mongoose v8
});


console.log('MongoDB connected');
} catch (error) {
console.error('MongoDB connection failed:', error.message);
process.exit(1);
}
};


module.exports = connectDB;