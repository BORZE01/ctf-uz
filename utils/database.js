const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ctf-uz';

async function connectDB() {
    try {
        await mongoose.connect(MONGODB_URI, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000
        });
        console.log('✅ MongoDB ulandi:', MONGODB_URI.replace(/\/\/.*@/, '//***@'));
        return true;
    } catch (err) {
        console.error('❌ MongoDB xatosi:', err.message);
        console.error('   MongoDB ishlayotganini tekshiring!');
        process.exit(1);
    }
}

// Ulanishni kuzatish
mongoose.connection.on('disconnected', () => {
    console.warn('⚠️ MongoDB uzildi');
});

mongoose.connection.on('reconnected', () => {
    console.log('✅ MongoDB qayta ulandi');
});

module.exports = { connectDB, mongoose };