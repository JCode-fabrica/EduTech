import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

export default function LineChart({ labels, data, label }: { labels: string[]; data: number[]; label?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const chart = new Chart(ref.current, {
      type: 'line',
      data: { labels, datasets: [{ label: label || 'Série', data, borderColor: '#38BDF8', backgroundColor: 'rgba(56,189,248,0.2)', tension: 0.3, fill: true }] },
      options: { plugins: { legend: { display: false } }, responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }
    });
    return () => chart.destroy();
  }, [labels.join(','), data.join(',')]);
  return <div style={{ height: 240 }}><canvas ref={ref} /></div>;
}

