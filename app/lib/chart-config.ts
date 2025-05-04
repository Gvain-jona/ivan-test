import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Filler,
  Tooltip,
  Legend,
  TimeScale,
  ChartOptions,
  ChartData,
  ChartDataset
} from 'chart.js';
import { _DeepPartialObject } from 'chart.js/dist/types/utils';
import 'chart.js/auto';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Filler,
  Tooltip,
  Legend,
  TimeScale
);

// Define theme colors
export const chartColors = {
  primary: 'rgb(var(--primary))',
  primaryTransparent: 'rgba(var(--primary), 0.2)',
  secondary: 'rgb(var(--secondary))',
  secondaryTransparent: 'rgba(var(--secondary), 0.2)',
  accent: 'rgb(var(--accent))',
  accentTransparent: 'rgba(var(--accent), 0.2)',
  muted: 'rgb(var(--muted))',
  mutedTransparent: 'rgba(var(--muted), 0.2)',
  background: 'rgb(var(--background))',
  foreground: 'rgb(var(--foreground))',
  border: 'rgb(var(--border))',

  // Additional colors for charts
  blue: '#3b82f6',
  blueTransparent: 'rgba(59, 130, 246, 0.2)',
  green: '#22c55e',
  greenTransparent: 'rgba(34, 197, 94, 0.2)',
  red: '#ef4444',
  redTransparent: 'rgba(239, 68, 68, 0.2)',
  orange: '#f97316',
  orangeTransparent: 'rgba(249, 115, 22, 0.2)',
  purple: '#a855f7',
  purpleTransparent: 'rgba(168, 85, 247, 0.2)',
  yellow: '#eab308',
  yellowTransparent: 'rgba(234, 179, 8, 0.2)',
};

// Define color palettes for different chart types
export const colorPalettes = {
  default: [
    chartColors.blue,
    chartColors.green,
    chartColors.orange,
    chartColors.purple,
    chartColors.red,
    chartColors.yellow,
  ],
  defaultTransparent: [
    chartColors.blueTransparent,
    chartColors.greenTransparent,
    chartColors.orangeTransparent,
    chartColors.purpleTransparent,
    chartColors.redTransparent,
    chartColors.yellowTransparent,
  ],
  sequential: [
    'rgba(59, 130, 246, 1)',   // Blue 100%
    'rgba(59, 130, 246, 0.8)', // Blue 80%
    'rgba(59, 130, 246, 0.6)', // Blue 60%
    'rgba(59, 130, 246, 0.4)', // Blue 40%
    'rgba(59, 130, 246, 0.2)', // Blue 20%
  ],
  diverging: [
    chartColors.red,
    chartColors.orange,
    chartColors.yellow,
    chartColors.green,
    chartColors.blue,
  ],
};

// Default chart options
export const defaultOptions: _DeepPartialObject<ChartOptions<any>> = {
  responsive: true,
  maintainAspectRatio: false,
  animation: {
    duration: 1000,
    easing: 'easeOutQuart',
  },
  plugins: {
    legend: {
      position: 'top' as const,
      align: 'start' as const,
      labels: {
        boxWidth: 12,
        usePointStyle: true,
        pointStyle: 'circle',
        padding: 20,
        color: chartColors.foreground,
      },
    },
    tooltip: {
      backgroundColor: chartColors.background,
      titleColor: chartColors.foreground,
      bodyColor: chartColors.foreground,
      borderColor: chartColors.border,
      borderWidth: 1,
      padding: 12,
      cornerRadius: 4,
      displayColors: true,
      usePointStyle: true,
      boxWidth: 8,
      boxHeight: 8,
      boxPadding: 4,
    },
  },
  scales: {
    x: {
      grid: {
        display: false,
        drawBorder: false,
      },
      ticks: {
        color: chartColors.muted,
        padding: 8,
      },
      border: {
        display: false,
      },
    },
    y: {
      grid: {
        color: chartColors.border,
        drawBorder: false,
        lineWidth: 1,
      },
      ticks: {
        color: chartColors.muted,
        padding: 8,
      },
      border: {
        display: false,
      },
      beginAtZero: true,
    },
  },
  elements: {
    line: {
      tension: 0.4,
    },
    point: {
      radius: 3,
      hoverRadius: 5,
      borderWidth: 2,
      backgroundColor: chartColors.background,
    },
  },
};

// Line chart specific options
export const lineChartOptions: _DeepPartialObject<ChartOptions<'line'>> = {
  ...defaultOptions,
  elements: {
    ...defaultOptions.elements,
    line: {
      tension: 0.4,
      borderWidth: 2,
      fill: false,
    },
  },
};

// Bar chart specific options
export const barChartOptions: _DeepPartialObject<ChartOptions<'bar'>> = {
  ...defaultOptions,
  elements: {
    ...defaultOptions.elements,
    bar: {
      borderWidth: 0,
      borderRadius: 4,
    },
  },
};

// Pie/Doughnut chart specific options
export const pieChartOptions: _DeepPartialObject<ChartOptions<'pie' | 'doughnut'>> = {
  ...defaultOptions,
  plugins: {
    ...defaultOptions.plugins,
    legend: {
      ...defaultOptions.plugins?.legend,
      position: 'right',
    },
  },
  elements: {
    arc: {
      borderWidth: 2,
      borderColor: chartColors.background,
    },
  },
};

// Format currency values
export const formatCurrency = (value: number, compact: boolean = false): string => {
  const options: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: 'UGX',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  };

  if (compact) {
    options.notation = 'compact';
    options.compactDisplay = 'short';
  }

  return new Intl.NumberFormat('en-UG', options).format(value);
};

// Format percentage values
export const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

// Format number values with thousands separators
export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('en-US').format(value);
};

// Get gradient for line charts
export const getGradient = (ctx: CanvasRenderingContext2D, chartArea: any, color: string): CanvasGradient => {
  const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
  gradient.addColorStop(1, color.replace('rgb', 'rgba').replace(')', ', 0.2)'));
  return gradient;
};

// Helper to create dataset with consistent styling
export const createDataset = (
  label: string,
  data: number[],
  index: number = 0,
  type: 'line' | 'bar' | 'pie' | 'doughnut' = 'line',
  options: Partial<ChartDataset<any, any>> = {}
): ChartDataset<any, any> => {
  const color = colorPalettes.default[index % colorPalettes.default.length];
  const transparentColor = colorPalettes.defaultTransparent[index % colorPalettes.defaultTransparent.length];

  const baseDataset = {
    label,
    data,
    borderColor: color,
    backgroundColor: transparentColor,
    ...options,
  };

  if (type === 'line') {
    return {
      ...baseDataset,
      tension: 0.4,
      pointBackgroundColor: chartColors.background,
      pointBorderColor: color,
      pointBorderWidth: 2,
      pointRadius: 3,
      pointHoverRadius: 5,
    };
  }

  if (type === 'bar') {
    return {
      ...baseDataset,
      borderRadius: 4,
      borderWidth: 0,
      hoverBackgroundColor: color,
    };
  }

  if (type === 'pie' || type === 'doughnut') {
    return {
      ...baseDataset,
      backgroundColor: colorPalettes.default.map(color => color),
      borderColor: chartColors.background,
      borderWidth: 2,
      hoverOffset: 4,
    };
  }

  return baseDataset;
};
