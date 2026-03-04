const mongoose = require('mongoose');
require('dotenv').config();

async function fix() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to DB");

        const collection = mongoose.connection.collection('users');

        try {
            await collection.dropIndex('email_1');
            console.log("Dropped email_1 index");
        } catch (e) {
            console.log("email_1 index does not exist or already dropped");
        }

        try {
            await collection.dropIndex('guestId_1');
            console.log("Dropped guestId_1 index");
        } catch (e) {
            console.log("guestId_1 index does not exist or already dropped");
        }

        try {
            await collection.dropIndex('googleId_1');
            console.log("Dropped googleId_1 index");
        } catch (e) {
            console.log("googleId_1 index does not exist or already dropped");
        }

        console.log("Indexes dropped. Mongoose will recreate them with new schema options.");
        process.exit(0);
    } catch (error) {
        console.error("Error fixing indexes:", error);
        process.exit(1);
    }
}

fix();
