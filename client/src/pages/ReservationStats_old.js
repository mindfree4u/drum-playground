import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import dayjs from 'dayjs';
import './ReservationStats.css';

const getDateKey = (date, type = 'day') => {
  if (type === 'day') return dayjs(date).format('YYYY-MM-DD');
  if (type === 'week') return dayjs(date).startOf('week').format('YYYY-[W]WW');
  if (type === 'month') return dayjs(date).format('YYYY-MM');
  return '';
};

const ReservationStats = () => {
  const [stats, setStats] = useState({ day: {}, week: {}, month: {} });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      const q = collection(db, 'reservations');
      const snapshot = await getDocs(q);

      const dayStats = {};
      const weekStats = {};
      const monthStats = {};

      snapshot.forEach(doc => {
        const data = doc.data();
        const dateValue = typeof data.date === 'string'
          ? data.date
          : (data.date?.toDate ? data.date.toDate() : new Date(data.date.seconds * 1000));
        const dateKeyDay = getDateKey(dateValue, 'day');
        const dateKeyWeek = getDateKey(dateValue, 'week');
        const dateKeyMonth = getDateKey(dateValue, 'month');
        const type = data.type === '레슨' ? '레슨' : '연습';

        // 일별
        if (!dayStats[dateKeyDay]) dayStats[dateKeyDay] = { 레슨: 0, 연습: 0, total: 0 };
        dayStats[dateKeyDay][type]++;
        dayStats[dateKeyDay].total++;

        // 주별
        if (!weekStats[dateKeyWeek]) weekStats[dateKeyWeek] = { 레슨: 0, 연습: 0, total: 0 };
        weekStats[dateKeyWeek][type]++;
        weekStats[dateKeyWeek].total++;

        // 월별
        if (!monthStats[dateKeyMonth]) monthStats[dateKeyMonth] = { 레슨: 0, 연습: 0, total: 0 };
        monthStats[dateKeyMonth][type]++;
        monthStats[dateKeyMonth].total++;
      });

      setStats({ day: dayStats, week: weekStats, month: monthStats });
      setLoading(false);
    };

    fetchStats();
  }, []);

  const renderTable = (data, label) => (
    <div className="stats-table-section">
      <h3>{label}별 예약 통계</h3>
      <table className="stats-table">
        <thead>
          <tr>
            <th>{label}</th>
            <th>레슨</th>
            <th>연습</th>
            <th>합계</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(data)
            .sort((a, b) => a[0] < b[0] ? 1 : -1)
            .map(([key, value]) => (
              <tr key={key}>
                <td>{key}</td>
                <td>{value.레슨}</td>
                <td>{value.연습}</td>
                <td>{value.total}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="reservation-stats-container">
      <h2>예약 통계 (기간별, 레슨/연습)</h2>
      {loading ? (
        <div className="stats-loading">로딩 중...</div>
      ) : (
        <>
          {renderTable(stats.day, '일')}
          {renderTable(stats.week, '주')}
          {renderTable(stats.month, '월')}
        </>
      )}
    </div>
  );
};

export default ReservationStats;
