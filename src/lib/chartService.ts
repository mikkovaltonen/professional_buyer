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
    if (!productData || productData.length === 0) {
      console.warn('[ChartService] generateProductChart: No product data provided. Returning empty chart URL.');
      return '';
    }
    console.log(`[ChartService] generateProductChart: Starting chart generation for ${productData.length} data points.`);
    if (productData.length > 0) {
        const firstPoint = productData[0];
        const lastPoint = productData[productData.length - 1];
        console.log(`[ChartService] generateProductChart: Input data spans from (approx) ${firstPoint.Year_Month} to ${lastPoint.Year_Month} (based on original array order). Product code: ${firstPoint['Product code'] || 'N/A'}`);
    }

    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 400;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('[ChartService] generateProductChart: Could not get 2D canvas context. Cannot generate chart.');
      return '';
    }

    const sortedData = [...productData].sort((a, b) => 
      new Date(a.Year_Month).getTime() - new Date(b.Year_Month).getTime()
    );
    console.log(`[ChartService] generateProductChart: Data sorted. First point: ${sortedData[0]?.Year_Month}, Last point: ${sortedData[sortedData.length - 1]?.Year_Month}.`);

    const labels = sortedData.map(d => d.Year_Month);
    const actualData = sortedData.map(d => d.Quantity);
    const forecastData = sortedData.map(d => d.new_forecast_manually_adjusted ?? d.new_forecast ?? null);

    console.log(`[ChartService] generateProductChart: Prepared data for chart: ${labels.length} labels, ${actualData.length} actual data points, ${forecastData.length} forecast data points.`);
    
    const chartTitle = productData.length > 0 ? 
        `Demand for ${productData[0]['Product description']} (${productData[0]['Product code']})` : 
        'Product Demand Over Time';

    console.log(`[ChartService] generateProductChart: Creating new Chart instance with title: "${chartTitle}".`);
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
            label: 'Forecast (Corrected/New)',
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
            text: chartTitle
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

    const dataUrl = canvas.toDataURL('image/png');
    console.log(`[ChartService] generateProductChart: Chart generated and converted to data URL. URL length: ${dataUrl.length}.`);
    return dataUrl;
  }
} 