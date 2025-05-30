const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
const { onDocumentCreated, onDocumentDeleted } = require('firebase-functions/v2/firestore');
const { onCall } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const cors = require('cors')({ origin: true });

admin.initializeApp();

// Secrets 정의
const naverEmail = defineSecret('NAVER_EMAIL');
const naverPassword = defineSecret('NAVER_PASSWORD');

const adminMail = ['mindfree4u@daum.net', 'jsdtoner@naver.com', 'ddfoo@naver.com'];

const getTransporter = (email, password) => nodemailer.createTransport({
  host: 'smtp.naver.com',
  port: 465,
  secure: true,
  auth: {
    user: email,
    pass: password,
  },
});

// 예약 생성 시 이메일 발송 (v2 문법)
exports.sendReservationMail = onDocumentCreated(
  {
    document: 'reservations/{reservationId}',
    secrets: [naverEmail, naverPassword],
  },
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;
    const data = snapshot.data();
    if (!data) return;
    
    const transporter = getTransporter(naverEmail.value(), naverPassword.value());
    const mailOptions = {
      from: `"드럼놀이터" <${naverEmail.value()}>`,
      to: adminMail,
      subject: `[예약 알림] ${data.userName}님의 새로운 예약[${data.type}] ${data.date},${data.timeSlot} (${data.room})이 등록되었습니다`,
      text: `예약자: ${data.userName}\n구분: ${data.type}\n날짜: ${data.date}\n시간: ${data.timeSlot}\n룸: ${data.room}`,
    };
    await transporter.sendMail(mailOptions);
    return null;
  }
);

// 예약 취소 시 이메일 발송 (v2 문법)
exports.sendCancelMail = onDocumentDeleted(
  {
    document: 'reservations/{reservationId}',
    secrets: [naverEmail, naverPassword],
  },
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;
    const data = snapshot.data();

    if (!data) return;
    const transporter = getTransporter(naverEmail.value(), naverPassword.value());
    const mailOptions = {
      from: `"드럼놀이터" <${naverEmail.value()}>`,
      to: adminMail,
      subject: `[예약 취소 알림] ${data.userName}님의 [${data.type}] ${data.date},${data.timeSlot} (${data.room}) 예약이 취소되었습니다`,
      text: `예약자: ${data.userName}\n구분: ${data.type}\n날짜: ${data.date}\n시간: ${data.timeSlot}\n룸: ${data.room}`,
    };
    await transporter.sendMail(mailOptions);
    return null;
  }
);

// Firestore 데이터베이스 참조
const db = admin.firestore();

// 드럼 연습 기록 저장 함수 (v2)
exports.savePlayRecord = onCall(async (request) => {
  try {
    // 사용자 인증 확인
    if (!request.auth) {
      throw new functions.https.HttpsError('unauthenticated', '인증되지 않은 사용자입니다.');
    }

    const userId = request.auth.uid;
    const { bpm, duration, pattern, accuracy, timestamp } = request.data;

    // 데이터 유효성 검사
    if (!bpm || !duration || !pattern || accuracy === undefined || !timestamp) {
      throw new functions.https.HttpsError('invalid-argument', '필수 데이터가 누락되었습니다.');
    }

    // Firestore에 연습 기록 저장
    const recordRef = db.collection('users').doc(userId).collection('playRecords');
    await recordRef.add({
      bpm,
      duration,
      pattern,
      accuracy,
      timestamp,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return { success: true, message: '연습 기록이 저장되었습니다.' };
  } catch (error) {
    console.error('Error saving play record:', error);
    throw new functions.https.HttpsError('internal', '연습 기록 저장 중 오류가 발생했습니다.');
  }
});

// 사용자의 연습 기록 조회 함수 (v2)
exports.getPlayRecords = onCall(async (request) => {
  try {
    // 사용자 인증 확인
    if (!request.auth) {
      throw new functions.https.HttpsError('unauthenticated', '인증되지 않은 사용자입니다.');
    }

    const userId = request.auth.uid;
    const { limit = 10, startAfter } = request.data;

    // Firestore에서 연습 기록 조회
    let query = db.collection('users')
      .doc(userId)
      .collection('playRecords')
      .orderBy('timestamp', 'desc')
      .limit(limit);

    if (startAfter) {
      query = query.startAfter(startAfter);
    }

    const snapshot = await query.get();
    const records = [];

    snapshot.forEach(doc => {
      records.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return { records };
  } catch (error) {
    console.error('Error getting play records:', error);
    throw new functions.https.HttpsError('internal', '연습 기록 조회 중 오류가 발생했습니다.');
  }
});

// 연습 통계 계산 함수 (v2)
exports.calculateStats = onCall(async (request) => {
  try {
    // 사용자 인증 확인
    if (!request.auth) {
      throw new functions.https.HttpsError('unauthenticated', '인증되지 않은 사용자입니다.');
    }

    const userId = request.auth.uid;
    const { startDate, endDate } = request.data;

    // 날짜 범위에 따른 쿼리 설정
    let query = db.collection('users')
      .doc(userId)
      .collection('playRecords')
      .orderBy('timestamp', 'desc');

    if (startDate) {
      query = query.where('timestamp', '>=', startDate);
    }
    if (endDate) {
      query = query.where('timestamp', '<=', endDate);
    }

    const snapshot = await query.get();
    
    // 통계 계산
    let totalDuration = 0;
    let totalRecords = 0;
    let avgAccuracy = 0;
    let maxBpm = 0;

    snapshot.forEach(doc => {
      const data = doc.data();
      totalDuration += data.duration;
      totalRecords++;
      avgAccuracy += data.accuracy;
      maxBpm = Math.max(maxBpm, data.bpm);
    });

    return {
      totalDuration,
      totalRecords,
      avgAccuracy: totalRecords > 0 ? avgAccuracy / totalRecords : 0,
      maxBpm
    };
  } catch (error) {
    console.error('Error calculating stats:', error);
    throw new functions.https.HttpsError('internal', '통계 계산 중 오류가 발생했습니다.');
  }
});

// 회원가입 시 이메일 발송 (v2 문법)
exports.onNewUserSignup = onDocumentCreated(
  {
    document: 'users/{userId}',
    secrets: [naverEmail, naverPassword],
  },
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;
    const data = snapshot.data();
    if (!data) return;

    const transporter = getTransporter(naverEmail.value(), naverPassword.value());
    const mailOptions = {
      from: `"드럼놀이터" <${naverEmail.value()}>`,
      to: adminMail,
      subject: `[드럼놀이터] 새로운 회원가입 알림(${data.name})`,
      html: `
        <h2>새로운 회원이 가입했습니다.</h2>
        <p><strong>아이디:</strong> ${data.userId}</p>
        <p><strong>이름:</strong> ${data.name}</p>
        <p><strong>이메일:</strong> ${data.email}</p>
        <p><strong>전화번호:</strong> ${data.phone}</p>
        <p><strong>가입일시:</strong> ${data.createdAt ? data.createdAt.toDate().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }) : '정보 없음'}</p>
      `
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log('Signup notification email sent successfully');
      return null;
    } catch (error) {
      console.error('Error sending signup notification email:', error);
      return null;
    }
  }
);

// 결제 완료 시 관리자에게 이메일 전송 (v2)
exports.sendPaymentNotification = onCall(
  {
    secrets: [naverEmail, naverPassword],
  },
  async (request) => {
    const { userName, amount, paymentType, timestamp } = request.data;

    try {
      const transporter = getTransporter(naverEmail.value(), naverPassword.value());
      
      const mailOptions = {
        from: `"드럼놀이터" <${naverEmail.value()}>`,
        to: adminMail,
        subject: `[결제 알림] ${userName}님의 새로운 결제가 완료되었습니다`,
        html: `
          <h2>새로운 결제 알림</h2>
          <p>결제자: ${userName}</p>
          <p>결제 구분: ${paymentType}</p>
          <p>결제 금액: ${amount.toLocaleString()}원</p>
          <p>결제 시간: ${timestamp}</p>
        `
      };

      await transporter.sendMail(mailOptions);
      console.log('Payment notification email sent successfully');
      return { success: true };
    } catch (error) {
      console.error('이메일 전송 실패:', error);
      throw new functions.https.HttpsError('internal', '이메일 전송에 실패했습니다.');
    }
  }
);

// 아이디 찾기 이메일 전송 함수 (v2)
exports.sendIdEmail = onCall(
  {
    secrets: [naverEmail, naverPassword],
  },
  async (request) => {
    const { email, userId } = request.data;

    try {
      const transporter = getTransporter(naverEmail.value(), naverPassword.value());
      
      const mailOptions = {
        from: `"드럼놀이터" <${naverEmail.value()}>`,
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

      await transporter.sendMail(mailOptions);
      console.log('ID find email sent successfully');
      return { success: true, message: '이메일이 전송되었습니다.' };
    } catch (error) {
      console.error('이메일 전송 실패:', error);
      throw new functions.https.HttpsError('internal', '이메일 전송에 실패했습니다.');
    }
  }
);

// 비밀번호 찾기 이메일 전송 함수 (v2)
exports.sendPasswordEmail = onCall(
  {
    secrets: [naverEmail, naverPassword],
  },
  async (request) => {
    console.log('Password find request received:', request.data);
    
    const { email, userId } = request.data;
    
    if (!email || !userId) {
      console.error('Missing required fields:', { email, userId });
      throw new functions.https.HttpsError(
        'invalid-argument',
        '이메일과 사용자 ID가 필요합니다.'
      );
    }

    try {
      console.log('Creating email transporter...');
      const transporter = getTransporter(naverEmail.value(), naverPassword.value());
      
      // Firebase Admin SDK를 사용하여 비밀번호 재설정 링크 생성
      const actionCodeSettings = {
        url: 'https://www.ddfoo.co.kr/reset-password',
        handleCodeInApp: true
      };

      const resetLink = await admin.auth().generatePasswordResetLink(email, actionCodeSettings);
      
      // 도메인을 ddfoo.co.kr로 변경하고 oobCode 파라미터 유지
      const oobCode = resetLink.split('oobCode=')[1];
      const customResetLink = `https://www.ddfoo.co.kr/reset-password?oobCode=${oobCode}`;
      
      console.log('Preparing email options...');
      const mailOptions = {
        from: `"드럼놀이터" <${naverEmail.value()}>`,
        to: email,
        subject: '[드럼놀이터] 비밀번호 재설정',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">드럼놀이터 비밀번호 재설정</h2>
            <p>안녕하세요. 드럼놀이터입니다.</p>
            <p>비밀번호 재설정을 요청하셨습니다.</p>
            <p>아래 링크를 클릭하여 새로운 비밀번호를 설정해주세요:</p>
            <p style="margin: 20px 0;">
              <a href="${customResetLink}" 
                 style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                비밀번호 재설정하기
              </a>
            </p>
            <p>이 링크는 1시간 동안만 유효합니다.</p>
            <p>비밀번호 재설정을 요청하지 않으셨다면, 이 이메일을 무시하셔도 됩니다.</p>
            <hr style="border: 1px solid #eee; margin: 20px 0;">
            <p style="color: #666; font-size: 12px;">본 메일은 발신 전용입니다.</p>
          </div>
        `
      };

      console.log('Sending email...', {
        from: mailOptions.from,
        to: mailOptions.to,
        subject: mailOptions.subject
      });

      await transporter.sendMail(mailOptions);
      console.log('Password reset email sent successfully');
      return { success: true, message: '비밀번호 재설정 링크가 이메일로 전송되었습니다.' };
    } catch (error) {
      console.error('이메일 전송 실패:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        code: error.code
      });
      throw new functions.https.HttpsError(
        'internal',
        '이메일 전송에 실패했습니다: ' + error.message
      );
    }
  }
);