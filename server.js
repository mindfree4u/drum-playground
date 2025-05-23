const express = require('express');
const admin = require('firebase-admin');
const bodyParser = require('body-parser');
const cors = require('cors');

// 서비스 계정 키 파일을 바탕으로 초기화
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.post('/api/send-push', async (req, res) => {
  const { tokens, message } = req.body;

  if (!tokens || !Array.isArray(tokens) || tokens.length === 0) {
    return res.status(400).json({ error: 'No tokens provided' });
  }
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'No message provided' });
  }

  const payload = {
    notification: {
      title: '드럼놀이터',
      body: message,
    },
    data: {
      click_action: 'FLUTTER_NOTIFICATION_CLICK', // 필요없음
    },
  };

  try {
    // FCM은 최대 500개의 토큰까지 한 번에 발송 가능
    const response = await admin.messaging().sendToDevice(tokens, payload);
    res.json({ success: true, response });
  } catch (error) {
    console.error('FCM send error:', error);
    res.status(500).json({ error: 'Failed to send push notification' });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Push server listening on port ${PORT}`);
});