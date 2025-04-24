export const generateChartImage = (
  chartData: { date: string; value: number | null; forecast?: number | null }[],
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
    canvas.width = 800;
    canvas.height = 400;
    const ctx = canvas.getContext('2d')!;

    // Set white background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw title
    ctx.fillStyle = 'black';
    ctx.font = 'bold 16px Arial';
    ctx.fillText(title, 40, 30);

    // Calculate data ranges
    const values = chartData
      .map(d => d.value)
      .filter((v): v is number => v !== null);
    const forecasts = chartData
      .map(d => d.forecast)
      .filter((v): v is number => v !== null);
    const allValues = [...values, ...forecasts];
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

      data.forEach((value, index) => {
        if (value === null) return;

        const x = 40 + ((750 - 40) * index) / (data.length - 1);
        const y = 350 - ((350 - 50) * (value - minValue)) / (maxValue - minValue);

        if (index === 0) {
          ctx.moveTo(x, y);
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

    // Draw actual values
    drawDataPoints(chartData.map(d => d.value), '#4ADE80');

    // Draw forecast values
    drawDataPoints(
      chartData.map(d => d.forecast),
      '#FFA500',
      true
    );

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
    
    // Actual values legend
    ctx.beginPath();
    ctx.strokeStyle = '#4ADE80';
    ctx.moveTo(600, 30);
    ctx.lineTo(650, 30);
    ctx.stroke();
    ctx.fillStyle = '#4ADE80';
    ctx.arc(625, 30, 4, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = 'black';
    ctx.fillText('Kysyntä', 660, 35);

    // Forecast values legend
    ctx.beginPath();
    ctx.strokeStyle = '#FFA500';
    ctx.setLineDash([5, 5]);
    ctx.moveTo(600, 50);
    ctx.lineTo(650, 50);
    ctx.stroke();
    ctx.fillStyle = '#FFA500';
    ctx.arc(625, 50, 4, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = 'black';
    ctx.fillText('Ennuste', 660, 55);

    // Convert to image URL
    const imageUrl = canvas.toDataURL('image/png');

    // Clean up
    document.body.removeChild(container);

    resolve(imageUrl);
  });
}; 