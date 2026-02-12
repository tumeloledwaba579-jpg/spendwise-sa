'use client';

export default function ChartTest() {
  return (
    <div className="stat-card" style={{ height: '300px', border: '3px solid red' }}>
      <h3>Chart Test Container</h3>
      <p style={{ color: 'red', fontWeight: 'bold' }}>
        If you see this red border, the component loads.
      </p>
      <p>Add your chart code below this line.</p>
    </div>
  );
}