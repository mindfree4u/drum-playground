import React, { useState, useEffect } from 'react';
import { Box, Tabs, Tab, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LabelList } from 'recharts';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import './ReservationStats.css';

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`stats-tabpanel-${index}`}
      aria-labelledby={`stats-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box className="stats-tab-panel">
          {children}
        </Box>
      )}
    </div>
  );
}

const ReservationStats = () => {
  const [tabValue, setTabValue] = useState(0);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [dailyStats, setDailyStats] = useState([]);
  const [monthlyStats, setMonthlyStats] = useState([]);
  const [yearlyStats, setYearlyStats] = useState([]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleMonthChange = async (event) => {
    const month = event.target.value;
    setSelectedMonth(month);
    await fetchDailyStats(month);
  };

  const handleYearChange = async (event) => {
    const year = event.target.value;
    setSelectedYear(year);
    await fetchMonthlyStats(year);
  };

  const fetchDailyStats = async (month) => {
    try {
      const [year, monthNum] = month.split('-');
      const monthStr = monthNum.padStart(2, '0');
      const daysInMonth = new Date(parseInt(year), parseInt(monthNum), 0).getDate();
      const startDateStr = `${year}-${monthStr}-01`;
      const endDateStr = `${year}-${monthStr}-${daysInMonth.toString().padStart(2, '0')}`;

      const reservationsRef = collection(db, 'reservations');
      const q = query(
        reservationsRef,
        where('date', '>=', startDateStr),
        where('date', '<=', endDateStr)
      );

      const querySnapshot = await getDocs(q);
      const stats = {};

      // 해당 월의 모든 날짜에 대해 초기값 설정
      for (let i = 1; i <= daysInMonth; i++) {
        stats[i.toString()] = { lessons: 0, practice: 0 };
      }

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (!data.date) return;
        const dateParts = data.date.split('-');
        if (dateParts.length !== 3) return;
        const day = parseInt(dateParts[2], 10);
        if (!day || !stats[day]) return;
        if (data.type === '레슨') {
          stats[day].lessons++;
        } else if (data.type === '연습') {
          stats[day].practice++;
        }
      });

      const formattedStats = Object.entries(stats).map(([date, counts]) => ({
        date: `${date}일`,
        lessons: counts.lessons,
        practice: counts.practice,
      }));

      setDailyStats(formattedStats.sort((a, b) => parseInt(a.date) - parseInt(b.date)));
    } catch (error) {
      console.error('Error fetching daily stats:', error);
    }
  };

  const fetchMonthlyStats = async (year) => {
    try {
      const startDateStr = `${year}-01-01`;
      const endDateStr = `${year}-12-31`;

      const reservationsRef = collection(db, 'reservations');
      const q = query(
        reservationsRef,
        where('date', '>=', startDateStr),
        where('date', '<=', endDateStr)
      );

      const querySnapshot = await getDocs(q);
      const stats = {};

      // 해당 연도의 모든 월에 대해 초기값 설정
      for (let i = 1; i <= 12; i++) {
        stats[i.toString()] = { lessons: 0, practice: 0 };
      }

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (!data.date) return;
        const dateParts = data.date.split('-');
        if (dateParts.length !== 3) return;
        const month = parseInt(dateParts[1], 10);
        if (!month || !stats[month]) return;
        if (data.type === '레슨') {
          stats[month].lessons++;
        } else if (data.type === '연습') {
          stats[month].practice++;
        }
      });

      const formattedStats = Object.entries(stats).map(([month, counts]) => ({
        date: `${month}월`,
        lessons: counts.lessons,
        practice: counts.practice,
      }));

      setMonthlyStats(formattedStats.sort((a, b) => parseInt(a.date) - parseInt(b.date)));
    } catch (error) {
      console.error('Error fetching monthly stats:', error);
    }
  };

  const fetchYearlyStats = async () => {
    try {
      const currentYear = new Date().getFullYear();
      const startYear = 2025; // 시작 연도를 2025년으로 고정
      const startDateStr = `${startYear}-01-01`;
      const endDateStr = `${currentYear}-12-31`;

      const reservationsRef = collection(db, 'reservations');
      const q = query(
        reservationsRef,
        where('date', '>=', startDateStr),
        where('date', '<=', endDateStr)
      );

      const querySnapshot = await getDocs(q);
      const stats = {};

      // 2025년부터 현재까지의 연도에 대해 초기값 설정
      for (let year = startYear; year <= currentYear; year++) {
        stats[year.toString()] = { lessons: 0, practice: 0 };
      }

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (!data.date) return;
        const dateParts = data.date.split('-');
        if (dateParts.length !== 3) return;
        const year = dateParts[0];
        if (!year || !stats[year]) return;
        if (data.type === '레슨') {
          stats[year].lessons++;
        } else if (data.type === '연습') {
          stats[year].practice++;
        }
      });

      const formattedStats = Object.entries(stats).map(([year, counts]) => ({
        date: `${year}년`,
        lessons: counts.lessons,
        practice: counts.practice,
      }));

      setYearlyStats(formattedStats.sort((a, b) => parseInt(a.date) - parseInt(b.date)));
    } catch (error) {
      console.error('Error fetching yearly stats:', error);
    }
  };

  const months = Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    return date.toISOString().slice(0, 7);
  });

  const years = Array.from({ length: 5 }, (_, i) => {
    const date = new Date();
    return (date.getFullYear() - i).toString();
  });

  // 컴포넌트 마운트 시 현재 월과 연도 자동 선택
  useEffect(() => {
    const currentDate = new Date();
    const currentMonth = currentDate.toISOString().slice(0, 7);
    const currentYear = currentDate.getFullYear().toString();
    
    setSelectedMonth(currentMonth);
    setSelectedYear(currentYear);
    
    fetchDailyStats(currentMonth);
    fetchMonthlyStats(currentYear);
    fetchYearlyStats();
  }, []);

  const renderDailyStats = () => {
    if (dailyStats.length === 0) {
      return null;
    }

    const chartWidth = Math.max(dailyStats.length * 36, 800);
    const chartHeight = 360;

    return (
      <Box className="stats-chart-container">
        <BarChart
          width={chartWidth}
          height={chartHeight}
          data={dailyStats}
          className="stats-chart"
          barGap={0}
          barSize={30}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="date" 
            label={{ value: '일자', position: 'insideBottom', offset: -5 }}
          />
          <YAxis 
            label={{ value: '건수', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip />
          <Legend />
          <Bar 
            dataKey="lessons" 
            name="레슨" 
            fill="#FF69B4"
            radius={[4, 4, 0, 0]}
          >
            <LabelList dataKey="lessons" position="top" />
          </Bar>
          <Bar 
            dataKey="practice" 
            name="연습" 
            fill="#98FB98"
            radius={[4, 4, 0, 0]}
          >
            <LabelList dataKey="practice" position="top" />
          </Bar>
        </BarChart>
      </Box>
    );
  };

  const renderMonthlyStats = () => {
    if (monthlyStats.length === 0) {
      return null;
    }

    const chartWidth = Math.max(monthlyStats.length * 80, 800);
    const chartHeight = 360;

    return (
      <Box className="stats-chart-container">
        <BarChart
          width={chartWidth}
          height={chartHeight}
          data={monthlyStats}
          className="stats-chart"
          barGap={0}
          barSize={40}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="date" 
            label={{ value: '월', position: 'insideBottom', offset: -5 }}
          />
          <YAxis 
            label={{ value: '건수', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip />
          <Legend />
          <Bar 
            dataKey="lessons" 
            name="레슨" 
            fill="#FF69B4"
            radius={[4, 4, 0, 0]}
          >
            <LabelList dataKey="lessons" position="top" />
          </Bar>
          <Bar 
            dataKey="practice" 
            name="연습" 
            fill="#98FB98"
            radius={[4, 4, 0, 0]}
          >
            <LabelList dataKey="practice" position="top" />
          </Bar>
        </BarChart>
      </Box>
    );
  };

  const renderYearlyStats = () => {
    if (yearlyStats.length === 0) {
      return null;
    }

    const chartWidth = Math.max(yearlyStats.length * 120, 800);
    const chartHeight = 360;

    return (
      <Box className="stats-chart-container">
        <BarChart
          width={chartWidth}
          height={chartHeight}
          data={yearlyStats}
          className="stats-chart"
          barGap={0}
          barSize={50}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="date" 
            label={{ value: '연도', position: 'insideBottom', offset: -5 }}
          />
          <YAxis 
            label={{ value: '건수', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip />
          <Legend />
          <Bar 
            dataKey="lessons" 
            name="레슨" 
            fill="#FF69B4"
            radius={[4, 4, 0, 0]}
          >
            <LabelList dataKey="lessons" position="top" />
          </Bar>
          <Bar 
            dataKey="practice" 
            name="연습" 
            fill="#98FB98"
            radius={[4, 4, 0, 0]}
          >
            <LabelList dataKey="practice" position="top" />
          </Bar>
        </BarChart>
      </Box>
    );
  };

  return (
    <Box className="stats-container">
      <Tabs 
        value={tabValue} 
        onChange={handleTabChange} 
        centered
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        className="custom-tabs"
        sx={{
          '& .MuiTabs-scrollButtons': {
            '&.Mui-disabled': { opacity: 0.3 },
          },
        }}
      >
        <Tab 
          label="일별 통계" 
          className="stats-tab custom-tab"
        />
        <Tab 
          label="월별 통계" 
          className="stats-tab custom-tab"
        />
        <Tab 
          label="년도별 통계" 
          className="stats-tab custom-tab"
        />
      </Tabs>

      <TabPanel value={tabValue} index={0}>
        <FormControl className="stats-form-control custom-form-control">
          <InputLabel className="month-label custom-input-label">월 선택</InputLabel>
          <Select
            value={selectedMonth}
            label="월 선택"
            onChange={handleMonthChange}
            className="month-selector custom-select"
            inputProps={{
              className: 'month-select-input'
            }}
          >
            {months.map((month) => (
              <MenuItem key={month} value={month} className="custom-menu-item">
                {month}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        {renderDailyStats()}
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <FormControl className="stats-form-control custom-form-control">
          <InputLabel className="month-label custom-input-label">연도 선택</InputLabel>
          <Select
            value={selectedYear}
            label="연도 선택"
            onChange={handleYearChange}
            className="month-selector custom-select"
            inputProps={{
              className: "month-input-select custom-input"
            }}
          >
            {years.map((year) => (
              <MenuItem key={year} value={year} className="custom-menu-item">
                {year}년
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        {renderMonthlyStats()}
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        {renderYearlyStats()}
      </TabPanel>
    </Box>
  );
};

export default ReservationStats; 