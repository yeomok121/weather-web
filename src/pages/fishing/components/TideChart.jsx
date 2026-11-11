// 낚시 페이지: 오늘·내일 예측 조위 그래프 (지금 시각 세로선, 만조·간조 점 표시)
import { Area, AreaChart, ReferenceDot, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatTideTime } from '../fishingFormat';

const hourLabel = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Seoul', hour: '2-digit', hourCycle: 'h23' });

export default function TideChart({ points, extremes, now }) {
  if (points.length < 2) return null;
  const visible = extremes.filter((item) => item.at >= points[0].time && item.at <= points[points.length - 1].time);
  return <div className="fish-tide-chart" role="img" aria-label="시간별 예측 조위 그래프">
    <ResponsiveContainer width="100%" height={170}>
      <AreaChart data={points} margin={{ top: 18, right: 10, bottom: 0, left: -18 }}>
        <defs>
          <linearGradient id="fishTideFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#14a3a0" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#14a3a0" stopOpacity={0.03} />
          </linearGradient>
        </defs>
        <XAxis dataKey="time" type="number" scale="time" domain={['dataMin', 'dataMax']} tickFormatter={(t) => `${hourLabel.format(t)}시`} tick={{ fontSize: 11, fill: '#6f8298' }} minTickGap={28} />
        <YAxis tick={{ fontSize: 11, fill: '#6f8298' }} width={48} unit="" />
        <Tooltip labelFormatter={(t) => formatTideTime(new Date(t).toISOString(), now)} formatter={(value) => [`${Math.round(value)} cm`, '예측 조위']} />
        <Area type="monotone" dataKey="height" stroke="#0f8c8a" strokeWidth={2} fill="url(#fishTideFill)" isAnimationActive={false} />
        {now >= points[0].time && now <= points[points.length - 1].time && <ReferenceLine x={now} stroke="#e07a2f" strokeDasharray="4 3" label={{ value: '지금', position: 'top', fontSize: 11, fill: '#c2621c' }} />}
        {visible.map((item) => <ReferenceDot key={item.time} x={item.at} y={item.height_cm} r={4} fill={item.type === 'high' ? '#1d6fb8' : '#0f8c8a'} stroke="#fff" />)}
      </AreaChart>
    </ResponsiveContainer>
  </div>;
}
