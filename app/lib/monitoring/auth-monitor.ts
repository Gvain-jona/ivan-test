import { AuthError, ErrorLog, PerformanceMetric } from '../auth/types';
import { createClient } from '../supabase/client';

class AuthMonitor {
  private static instance: AuthMonitor;
  private errorBuffer: AuthError[] = [];
  private metricsBuffer: PerformanceMetric[] = [];
  private flushInterval: NodeJS.Timer;
  private readonly FLUSH_INTERVAL = 30000; // 30 seconds
  private readonly ERROR_BUFFER_SIZE = 50;
  private readonly METRICS_BUFFER_SIZE = 100;

  private constructor() {
    this.flushInterval = setInterval(() => {
      this.flushBuffers();
    }, this.FLUSH_INTERVAL);
  }

  public static getInstance(): AuthMonitor {
    if (!AuthMonitor.instance) {
      AuthMonitor.instance = new AuthMonitor();
    }
    return AuthMonitor.instance;
  }

  // Log an error with context
  public async logError(error: Omit<AuthError, 'timestamp'>): Promise<void> {
    const errorLog: AuthError = {
      ...error,
      timestamp: new Date().toISOString()
    };

    this.errorBuffer.push(errorLog);

    // Flush immediately for critical errors
    if (this.errorBuffer.length >= this.ERROR_BUFFER_SIZE) {
      await this.flushErrorBuffer();
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Auth Error:', errorLog);
    }
  }

  // Record a performance metric
  public async recordMetric(metric: Omit<PerformanceMetric, 'timestamp'>): Promise<void> {
    const fullMetric: PerformanceMetric = {
      ...metric,
      timestamp: new Date().toISOString()
    };

    this.metricsBuffer.push(fullMetric);

    if (this.metricsBuffer.length >= this.METRICS_BUFFER_SIZE) {
      await this.flushMetricsBuffer();
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Auth Metric:', fullMetric);
    }
  }

  // Performance monitoring wrapper
  public async measureOperation<T>(
    operation: string,
    fn: () => Promise<T>,
    context?: Record<string, unknown>
  ): Promise<T> {
    const startTime = performance.now();
    let success = false;

    try {
      const result = await fn();
      success = true;
      return result;
    } finally {
      const duration = performance.now() - startTime;
      await this.recordMetric({
        operation,
        duration,
        success,
        context
      });
    }
  }

  private async flushBuffers(): Promise<void> {
    await Promise.all([
      this.flushErrorBuffer(),
      this.flushMetricsBuffer()
    ]);
  }

  private async flushErrorBuffer(): Promise<void> {
    if (this.errorBuffer.length === 0) return;

    const supabase = createClient();
    const errors = [...this.errorBuffer];
    this.errorBuffer = [];

    try {
      const { error } = await supabase
        .from('auth_error_logs')
        .insert(errors.map(error => ({
          ...error,
          severity: 'error',
          resolved: false
        })));

      if (error) {
        console.error('Failed to flush error buffer:', error);
        // Re-add errors to buffer
        this.errorBuffer = [...errors, ...this.errorBuffer].slice(-this.ERROR_BUFFER_SIZE);
      }
    } catch (e) {
      console.error('Exception flushing error buffer:', e);
      // Re-add errors to buffer
      this.errorBuffer = [...errors, ...this.errorBuffer].slice(-this.ERROR_BUFFER_SIZE);
    }
  }

  private async flushMetricsBuffer(): Promise<void> {
    if (this.metricsBuffer.length === 0) return;

    const supabase = createClient();
    const metrics = [...this.metricsBuffer];
    this.metricsBuffer = [];

    try {
      const { error } = await supabase
        .from('auth_performance_metrics')
        .insert(metrics);

      if (error) {
        console.error('Failed to flush metrics buffer:', error);
        // Re-add metrics to buffer
        this.metricsBuffer = [...metrics, ...this.metricsBuffer].slice(-this.METRICS_BUFFER_SIZE);
      }
    } catch (e) {
      console.error('Exception flushing metrics buffer:', e);
      // Re-add metrics to buffer
      this.metricsBuffer = [...metrics, ...this.metricsBuffer].slice(-this.METRICS_BUFFER_SIZE);
    }
  }

  public destroy(): void {
    clearInterval(this.flushInterval);
  }
}

export const authMonitor = AuthMonitor.getInstance();
