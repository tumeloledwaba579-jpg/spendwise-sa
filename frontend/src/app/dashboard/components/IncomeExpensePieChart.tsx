'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface IncomeExpensePieChartProps {
  income?: number;
  expenses?: number;
}

const IncomeExpensePieChart = ({ income = 0, expenses = 0 }: IncomeExpensePieChartProps) => {
  // Calculate net total
  const netTotal = income - expenses;
  
  // Prepare data - only include values greater than 0
  const chartData = [
    ...(income > 0 ? [{ name: 'Income', value: income, color: '#00C853' }] : []),
    ...(expenses > 0 ? [{ name: 'Expenses', value: expenses, color: '#FF3D00' }] : [])
  ];

  // Custom formatter for tooltip that handles undefined
  const formatTooltip = (value: number | string | undefined) => {
    if (value === undefined || value === null) {
      return ['R 0', 'Amount'];
    }
    if (typeof value === 'number') {
      return [`R ${value.toLocaleString()}`, 'Amount'];
    }
    return [value, 'Amount'];
  };

  // If no data, show empty state
  if (chartData.length === 0) {
    return (
      <div className="stat-card" style={{ height: '350px', position: 'relative' }}>
        <h3 className="stat-title" style={{ marginBottom: '20px' }}>Income vs Expenses</h3>
        <div style={{ 
          height: '280px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          flexDirection: 'column',
          color: '#666',
          background: '#f8f9fa',
          borderRadius: '12px'
        }}>
          <p style={{ marginBottom: '10px' }}>No data available</p>
          <p style={{ fontSize: '14px' }}>Add income or expenses to see chart</p>
        </div>
      </div>
    );
  }

  return (
    <div className="stat-card" style={{ height: '350px', position: 'relative' }}>
      <h3 className="stat-title" style={{ marginBottom: '20px' }}>Income vs Expenses</h3>
      
      <div style={{ height: '280px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius="60%"
              outerRadius="80%"
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              formatter={formatTooltip}
            />
            <Legend />
            
            {/* Center Label */}
            {chartData.length > 0 && (
              <>
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
              </>
            )}
          </PieChart>
        </ResponsiveContainer>
      </div>
      
      {/* Summary Stats */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-around', 
        marginTop: '10px',
        padding: '10px',
        borderTop: '1px solid #eee'
      }}>
        {income > 0 && (
          <div style={{ textAlign: 'center' }}>
            <span style={{ color: '#00C853', fontWeight: 600, display: 'block' }}>
              +R {income.toLocaleString()}
            </span>
            <span style={{ fontSize: '12px', color: '#666' }}>Income</span>
          </div>
        )}
        {expenses > 0 && (
          <div style={{ textAlign: 'center' }}>
            <span style={{ color: '#FF3D00', fontWeight: 600, display: 'block' }}>
              -R {expenses.toLocaleString()}
            </span>
            <span style={{ fontSize: '12px', color: '#666' }}>Expenses</span>
          </div>
        )}
        {income === 0 && expenses === 0 && (
          <div style={{ textAlign: 'center', color: '#666' }}>
            No transactions this month
          </div>
        )}
      </div>
    </div>
  );
};

export default IncomeExpensePieChart;