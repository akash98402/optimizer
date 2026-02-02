
import React, { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import { StressPoint } from '../types';

Chart.register(...registerables);

interface StressChartProps {
  data: StressPoint[];
}

const StressChart: React.FC<StressChartProps> = ({ data }) => {
  const chartRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (chartRef.current) {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      const ctx = chartRef.current.getContext('2d');
      if (ctx) {
        chartInstance.current = new Chart(ctx, {
          type: 'line',
          data: {
            labels: data.map(d => d.date),
            datasets: [{
              label: 'Workload Stress Score',
              data: data.map(d => d.stressScore),
              borderColor: '#2563EB',
              backgroundColor: 'rgba(37, 99, 235, 0.1)',
              fill: true,
              tension: 0.4,
              borderWidth: 3,
              pointRadius: 4,
              pointBackgroundColor: '#2563EB'
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: false
              },
              tooltip: {
                backgroundColor: '#FFF',
                titleColor: '#111827',
                bodyColor: '#111827',
                borderColor: '#E5E7EB',
                borderWidth: 1,
                padding: 12,
                displayColors: false,
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                grid: {
                  color: '#F3F4F6'
                }
              },
              x: {
                grid: {
                  display: false
                }
              }
            }
          }
        });
      }
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [data]);

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-80">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-[#111827]">📈 Predicted Stress Levels</h3>
        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded font-bold uppercase tracking-wider">Next 14 Days</span>
      </div>
      <div className="h-56 w-full">
        <canvas ref={chartRef}></canvas>
      </div>
      <p className="text-[10px] text-center text-gray-400 mt-2 uppercase font-bold tracking-widest">
        Sliding window workload analysis
      </p>
    </div>
  );
};

export default StressChart;
