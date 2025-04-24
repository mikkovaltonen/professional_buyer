import { Chart, registerables } from 'chart.js';
import { TimeSeriesData } from './dataService';

// Register Chart.js components
Chart.register(...registerables);

export class ChartService {
  private static instance: ChartService;

  private constructor() {}

  public static getInstance(): ChartService {
    if (!ChartService.instance) {
      ChartService.instance = new ChartService();
    }
    return ChartService.instance;
  }

  public generateProductChart(productData: TimeSeriesData[]): string {
    console.log('Generating chart for', productData.length, 'data points');

    // Create a canvas element
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 400;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('Could not get canvas context');
      return '';
    }

    // Sort data by date
    const sortedData = [...productData].sort((a, b) => 
      new Date(a.Year_Month).getTime() - new Date(b.Year_Month).getTime()
    );

    // Prepare data for the chart
    const labels = sortedData.map(d => d.Year_Month);
    const actualData = sortedData.map(d => d.Quantity);
    const forecastData = sortedData.map(d => d.forecast_12m || null);

    // Create the chart
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Actual Quantity',
            data: actualData,
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1,
            fill: false
          },
          {
            label: 'Forecast',
            data: forecastData,
            borderColor: 'rgb(255, 99, 132)',
            tension: 0.1,
            fill: false,
            borderDash: [5, 5] // Make forecast line dashed
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Product Demand Over Time'
          },
          tooltip: {
            mode: 'index',
            intersect: false
          }
        },
        scales: {
          x: {
            display: true,
            title: {
              display: true,
              text: 'Date'
            }
          },
          y: {
            display: true,
            title: {
              display: true,
              text: 'Quantity'
            },
            beginAtZero: true
          }
        }
      }
    });

    // Convert the chart to a data URL
    return canvas.toDataURL('image/png');
  }
} 