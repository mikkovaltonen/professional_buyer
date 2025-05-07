export const generateChartImage = (
  chartData: { 
    date: string; 
    value: number | null; 
    old_forecast?: number | null;
    new_forecast?: number | null;
    old_forecast_error?: number | null;
    new_forecast_manually_adjusted?: number | null;
  }[],
  title: string
): Promise<string> => {
  return new Promise((resolve) => {
    // Create a temporary container
    const container = document.createElement('div');
    container.style.width = '800px';
    container.style.height = '400px';
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    document.body.appendChild(container);

    // Create a canvas element
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 200;
    const ctx = canvas.getContext('2d')!;

    // Set white background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw title
    ctx.fillStyle = 'black';
    ctx.font = 'bold 16px Arial';
    ctx.fillText(title, 40, 30);

    // Calculate data ranges
    const allValues = chartData.flatMap(d => [
      d.value,
      d.old_forecast,
      d.new_forecast,
      d.old_forecast_error,
      d.new_forecast_manually_adjusted
    ].filter((v): v is number => v !== null));
    
    const maxValue = Math.max(...allValues);
    const minValue = Math.min(...allValues);

    // Draw axes
    ctx.beginPath();
    ctx.moveTo(40, 350);
    ctx.lineTo(750, 350);
    ctx.moveTo(40, 350);
    ctx.lineTo(40, 50);
    ctx.strokeStyle = '#666';
    ctx.stroke();

    // Draw data points
    const drawDataPoints = (
      data: (number | null)[],
      color: string,
      isDashed = false
    ) => {
      ctx.beginPath();
      ctx.strokeStyle = color;
      if (isDashed) {
        ctx.setLineDash([5, 5]);
      } else {
        ctx.setLineDash([]);
      }

      let started = false;
      data.forEach((value, index) => {
        if (value === null) return;

        const x = 40 + ((750 - 40) * index) / (data.length - 1);
        const y = 350 - ((350 - 50) * (value - minValue)) / (maxValue - minValue);

        if (!started) {
          ctx.moveTo(x, y);
          started = true;
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();

      // Draw points
      data.forEach((value, index) => {
        if (value === null) return;

        const x = 40 + ((750 - 40) * index) / (data.length - 1);
        const y = 350 - ((350 - 50) * (value - minValue)) / (maxValue - minValue);

        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
      });
    };

    // Draw all data series
    drawDataPoints(chartData.map(d => d.value), '#4338ca'); // Actual values in blue
    drawDataPoints(chartData.map(d => d.old_forecast), '#10b981', true); // Old forecast in green, dashed
    drawDataPoints(chartData.map(d => d.new_forecast), '#f59e0b', true); // New forecast in orange, dashed
    drawDataPoints(chartData.map(d => d.new_forecast_manually_adjusted), '#dc2626'); // Manually adjusted in red
    drawDataPoints(chartData.map(d => d.old_forecast_error), '#ef4444', true); // Forecast error in red, dashed

    // Draw date labels
    ctx.fillStyle = 'black';
    ctx.font = '12px Arial';
    const dateStep = Math.ceil(chartData.length / 6);
    chartData.forEach((data, index) => {
      if (index % dateStep === 0) {
        const x = 40 + ((750 - 40) * index) / (chartData.length - 1);
        const date = new Date(data.date);
        const label = `${date.getMonth() + 1}/${date.getFullYear()}`;
        ctx.fillText(label, x - 20, 370);
      }
    });

    // Draw value labels
    const valueStep = (maxValue - minValue) / 5;
    for (let i = 0; i <= 5; i++) {
      const value = minValue + i * valueStep;
      const y = 350 - ((350 - 50) * i) / 5;
      ctx.fillText(Math.round(value).toString(), 10, y + 5);
    }

    // Draw legend
    ctx.font = '14px Arial';
    ctx.setLineDash([]);
    
    const legendItems = [
      { color: '#4338ca', label: 'Kysyntä', y: 30, dashed: false },
      { color: '#10b981', label: 'Vanha ennuste', y: 50, dashed: true },
      { color: '#f59e0b', label: 'Uusi ennuste', y: 70, dashed: true },
      { color: '#dc2626', label: 'Korjattu ennuste', y: 90, dashed: false },
      { color: '#ef4444', label: 'Ennustevirhe', y: 110, dashed: true }
    ];

    legendItems.forEach(item => {
      ctx.beginPath();
      ctx.strokeStyle = item.color;
      if (item.dashed) {
        ctx.setLineDash([5, 5]);
      } else {
        ctx.setLineDash([]);
      }
      ctx.moveTo(600, item.y);
      ctx.lineTo(650, item.y);
      ctx.stroke();
      ctx.fillStyle = item.color;
      ctx.arc(625, item.y, 4, 0, 2 * Math.PI);
      ctx.fill();
      ctx.fillStyle = 'black';
      ctx.fillText(item.label, 660, item.y + 5);
    });

    // Palauta base64-data-url JPEG-muodossa (laatu 0.7)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
    resolve(dataUrl);
  });
}; 