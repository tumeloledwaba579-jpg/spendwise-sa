'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const data = [
  { name: 'Income', value: 32500, color: '#00C853' },
  { name: 'Expenses', value: 18750, color: '#FF3D00' },
];

const IncomeExpensePieChart = () => {
  const netTotal = data[0].value - data[1].value;

  return (
    <div className="stat-card" style={{ height: '350px', position: 'relative' }}>
      <h3 className="stat-title" style={{ marginBottom: '20px' }}>Income vs Expenses</h3>
      
      <div style={{ height: '280px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius="60%"
              outerRadius="80%"
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => [`R ${Number(value).toLocaleString()}`, 'Amount']} />
            <Legend />
            {/* Center Label */}
            <text
              x="50%"
              y="45%"
              textAnchor="middle"
              dominantBaseline="middle"
              style={{ fontSize: '24px', fontWeight: 'bold', fill: '#333' }}
            >
              R {netTotal.toLocaleString()}
            </text>
            <text
              x="50%"
              y="55%"
              textAnchor="middle"
              dominantBaseline="middle"
              style={{ fontSize: '14px', fill: '#666' }}
            >
              Net Balance
            </text>
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default IncomeExpensePieChart;