/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const {onRequest} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

const app = express();

// CORS 설정 업데이트
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// 이메일 전송을 위한 transporter 설정
const transporter = nodemailer.createTransport({
  service: 'naver',
  host: 'smtp.naver.com',
  port: 587,
  auth: {
    user: process.env.NAVER_EMAIL,
    pass: process.env.NAVER_PASSWORD
  }
});

// 이메일 설정 확인
logger.info('Email configuration:', {
  user: process.env.NAVER_EMAIL ? 'Set' : 'Not set',
  pass: process.env.NAVER_PASSWORD ? 'Set' : 'Not set'
});

// OPTIONS 요청 처리
app.options('*', cors());

// 아이디 찾기 이메일 전송 함수
exports.sendIdEmail = onRequest({
  cors: [
    "http://localhost:3000",
    "https://drum-playground.web.app",
    "https://drum-playground.firebaseapp.com"
  ],
  region: 'us-central1'
}, async (req, res) => {
  // OPTIONS 요청 처리
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  // POST 요청만 처리
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  const { email, userId } = req.body;
  logger.info('Received ID find request:', { email, userId });

  try {
    const mailOptions = {
      from: process.env.NAVER_EMAIL,
      to: email,
      subject: '[드럼놀이터] 아이디 찾기 결과',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">드럼놀이터 아이디 찾기</h2>
          <p>안녕하세요. 드럼놀이터입니다.</p>
          <p>회원님의 아이디는 <strong>${userId}</strong> 입니다.</p>
          <p>감사합니다.</p>
          <hr style="border: 1px solid #eee; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">본 메일은 발신 전용입니다.</p>
        </div>
      `
    };

    logger.info('Attempting to send email with options:', {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject
    });

    await transporter.sendMail(mailOptions);
    logger.info('Email sent successfully');
    res.json({ success: true, message: '이메일이 전송되었습니다.' });
  } catch (error) {
    logger.error('Error sending email:', error);
    logger.error('Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    res.status(500).json({ 
      success: false, 
      message: '이메일 전송 중 오류가 발생했습니다.',
      error: error.message 
    });
  }
});

// 비밀번호 찾기 이메일 전송 함수
exports.sendPasswordEmail = onRequest({
  cors: [
    "http://localhost:3000",
    "https://drum-playground.web.app",
    "https://drum-playground.firebaseapp.com"
  ],
  region: 'us-central1'
}, async (req, res) => {
  // OPTIONS 요청 처리
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  // POST 요청만 처리
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  const { email, maskedPassword } = req.body;
  logger.info('Received password find request:', { email, maskedPassword });

  try {
    const mailOptions = {
      from: process.env.NAVER_EMAIL,
      to: email,
      subject: '[드럼놀이터] 비밀번호 찾기 결과',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">드럼놀이터 비밀번호 찾기</h2>
          <p>안녕하세요. 드럼놀이터입니다.</p>
          <p>회원님의 비밀번호는 <strong>${maskedPassword}</strong> 입니다.</p>
          <p>보안을 위해 로그인 후 비밀번호를 변경하시기 바랍니다.</p>
          <p>감사합니다.</p>
          <hr style="border: 1px solid #eee; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">본 메일은 발신 전용입니다.</p>
        </div>
      `
    };

    logger.info('Attempting to send email with options:', {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject
    });

    await transporter.sendMail(mailOptions);
    logger.info('Email sent successfully');
    res.json({ success: true, message: '이메일이 전송되었습니다.' });
  } catch (error) {
    logger.error('Error sending email:', error);
    logger.error('Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    res.status(500).json({ 
      success: false, 
      message: '이메일 전송 중 오류가 발생했습니다.',
      error: error.message 
    });
  }
});

// Firebase Functions로 내보내기
exports.api = onRequest({
  cors: true,
  maxInstances: 10,
  region: 'asia-northeast3'
}, app);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log('Environment variables:', {
    NAVER_EMAIL: process.env.NAVER_EMAIL ? 'Set' : 'Not set',
    NAVER_PASSWORD: process.env.NAVER_PASSWORD ? 'Set' : 'Not set',
    PORT: process.env.PORT || 5000
  });
});
