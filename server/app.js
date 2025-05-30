// server/app.js

const functions = require('firebase-functions');
const express = require('express');
const cors = require('cors');
/*
const authRoutes = require('./routes/auth');
const reservationRoutes = require('./routes/reservations');
const roomRoutes = require('./routes/rooms');
const postRoutes = require('./routes/posts');
const config = require('./config/database');
*/

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB 연결 부분 주석 처리
/*
console.log('Attempting to connect to MongoDB...');
console.log('Connection URI:', config.database);

mongoose.connect(config.database, { 
    useNewUrlParser: true, 
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 10000,
    retryWrites: true,
    retryReads: true
})
  .then(() => {
    console.log('MongoDB Connected Successfully');
    console.log('MongoDB Connection State:', mongoose.connection.readyState);
  })
  .catch(err => {
    console.error('MongoDB Connection Error:', err);
    console.error('Error Details:', err.message);
    console.error('Error Stack:', err.stack);
  });
*/

// 테스트용 임시 라우트 추가
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is running without MongoDB!' });
});

// 기본 라우트 추가
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Drum Playground API' });
});

/*
app.use('/api/auth', authRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/posts', postRoutes);
*/

// Firebase Cloud Functions로 내보내기
exports.api = functions.https.onRequest(app);