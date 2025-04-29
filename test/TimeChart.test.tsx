import React from 'react';
import { render } from '@testing-library/react';
import TimeChart from '../src/components/TimeChart';

describe('TimeChart Component', () => {
  test('renders with null values in new_forecast_manually_adjusted', () => {
    const testData = [
      { date: '2024-01-01', value: 100, new_forecast_manually_adjusted: 110 },
      { date: '2024-02-01', value: 120, new_forecast_manually_adjusted: null },
      { date: '2024-03-01', value: 130, new_forecast_manually_adjusted: 140 }
    ];

    const { container } = render(
      <TimeChart 
        data={testData} 
        title="Test Chart" 
      />
    );

    // Verify the chart renders
    expect(container.querySelector('svg')).toBeInTheDocument();
    
    // Verify the line for new_forecast_manually_adjusted exists
    const lines = container.querySelectorAll('path.recharts-line-curve');
    expect(lines.length).toBeGreaterThan(0);
  });
}); 