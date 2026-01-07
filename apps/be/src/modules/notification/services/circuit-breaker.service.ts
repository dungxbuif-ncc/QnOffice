import { Injectable, Logger } from '@nestjs/common';

export enum CircuitBreakerState {
  CLOSED = 'CLOSED', // Normal operation
  OPEN = 'OPEN', // Circuit breaker is open (failing fast)
  HALF_OPEN = 'HALF_OPEN', // Testing if service recovered
}

export interface CircuitBreakerOptions {
  failureThreshold: number; // Number of failures before opening circuit
  recoveryTimeout: number; // Time to wait before trying half-open state (ms)
  resetTimeout: number; // Time to wait in half-open before closing (ms)
  monitoringPeriod: number; // Time window to track failures (ms)
}

interface CircuitBreakerStats {
  state: CircuitBreakerState;
  failureCount: number;
  lastFailureTime?: Date;
  nextAttemptTime?: Date;
  successCount: number;
}

@Injectable()
export class CircuitBreakerService {
  private readonly logger = new Logger(CircuitBreakerService.name);
  private readonly circuits: Map<string, CircuitBreakerStats> = new Map();

  private readonly defaultOptions: CircuitBreakerOptions = {
    failureThreshold: 5,
    recoveryTimeout: 60000, // 1 minute
    resetTimeout: 10000, // 10 seconds
    monitoringPeriod: 300000, // 5 minutes
  };

  /**
   * Execute function with circuit breaker protection
   */
  async execute<T>(
    circuitName: string,
    fn: () => Promise<T>,
    options?: Partial<CircuitBreakerOptions>,
  ): Promise<T> {
    const opts = { ...this.defaultOptions, ...options };
    const circuit = this.getOrCreateCircuit(circuitName);

    // Check if circuit is open
    if (circuit.state === CircuitBreakerState.OPEN) {
      if (Date.now() < circuit.nextAttemptTime!.getTime()) {
        throw new Error(
          `Circuit breaker '${circuitName}' is OPEN. Next attempt at ${circuit.nextAttemptTime}`,
        );
      } else {
        // Move to half-open state
        circuit.state = CircuitBreakerState.HALF_OPEN;
        circuit.successCount = 0;
        this.logger.log(
          `Circuit breaker '${circuitName}' moved to HALF_OPEN state`,
        );
      }
    }

    try {
      const result = await fn();
      await this.onSuccess(circuitName, circuit, opts);
      return result;
    } catch (error) {
      await this.onFailure(circuitName, circuit, error, opts);
      throw error;
    }
  }

  /**
   * Check if circuit breaker is open for a service
   */
  isOpen(circuitName: string): boolean {
    const circuit = this.circuits.get(circuitName);
    if (!circuit) return false;

    if (circuit.state === CircuitBreakerState.OPEN) {
      if (
        circuit.nextAttemptTime &&
        Date.now() >= circuit.nextAttemptTime.getTime()
      ) {
        // Should move to half-open
        return false;
      }
      return true;
    }

    return false;
  }

  /**
   * Get circuit breaker state
   */
  getState(circuitName: string): CircuitBreakerState {
    const circuit = this.circuits.get(circuitName);
    return circuit?.state || CircuitBreakerState.CLOSED;
  }

  /**
   * Get circuit breaker stats
   */
  getStats(circuitName: string): CircuitBreakerStats | null {
    return this.circuits.get(circuitName) || null;
  }

  /**
   * Get all circuit breaker stats
   */
  getAllStats(): Record<string, CircuitBreakerStats> {
    const stats: Record<string, CircuitBreakerStats> = {};
    for (const [name, circuit] of this.circuits) {
      stats[name] = { ...circuit };
    }
    return stats;
  }

  /**
   * Manually reset circuit breaker
   */
  reset(circuitName: string): void {
    const circuit = this.getOrCreateCircuit(circuitName);
    circuit.state = CircuitBreakerState.CLOSED;
    circuit.failureCount = 0;
    circuit.successCount = 0;
    circuit.lastFailureTime = undefined;
    circuit.nextAttemptTime = undefined;
    this.logger.log(`Circuit breaker '${circuitName}' manually reset`);
  }

  /**
   * Manually open circuit breaker
   */
  forceOpen(circuitName: string, recoveryTimeMs?: number): void {
    const circuit = this.getOrCreateCircuit(circuitName);
    circuit.state = CircuitBreakerState.OPEN;
    circuit.nextAttemptTime = new Date(
      Date.now() + (recoveryTimeMs || this.defaultOptions.recoveryTimeout),
    );
    this.logger.log(
      `Circuit breaker '${circuitName}' manually opened until ${circuit.nextAttemptTime}`,
    );
  }

  private getOrCreateCircuit(circuitName: string): CircuitBreakerStats {
    if (!this.circuits.has(circuitName)) {
      this.circuits.set(circuitName, {
        state: CircuitBreakerState.CLOSED,
        failureCount: 0,
        successCount: 0,
      });
    }
    return this.circuits.get(circuitName)!;
  }

  private async onSuccess(
    circuitName: string,
    circuit: CircuitBreakerStats,
    options: CircuitBreakerOptions,
  ): Promise<void> {
    if (circuit.state === CircuitBreakerState.HALF_OPEN) {
      circuit.successCount++;

      // If enough successful calls, close the circuit
      if (circuit.successCount >= 1) {
        // Could be configurable
        circuit.state = CircuitBreakerState.CLOSED;
        circuit.failureCount = 0;
        circuit.successCount = 0;
        circuit.lastFailureTime = undefined;
        circuit.nextAttemptTime = undefined;
        this.logger.log(
          `Circuit breaker '${circuitName}' CLOSED after successful recovery`,
        );
      }
    } else if (circuit.state === CircuitBreakerState.CLOSED) {
      // Reset failure count if it's been a while since last failure
      if (
        circuit.lastFailureTime &&
        Date.now() - circuit.lastFailureTime.getTime() >
          options.monitoringPeriod
      ) {
        circuit.failureCount = 0;
      }
    }
  }

  private async onFailure(
    circuitName: string,
    circuit: CircuitBreakerStats,
    error: Error,
    options: CircuitBreakerOptions,
  ): Promise<void> {
    circuit.failureCount++;
    circuit.lastFailureTime = new Date();

    if (circuit.state === CircuitBreakerState.HALF_OPEN) {
      // If failure in half-open state, go back to open
      circuit.state = CircuitBreakerState.OPEN;
      circuit.nextAttemptTime = new Date(Date.now() + options.recoveryTimeout);
      this.logger.error(
        `Circuit breaker '${circuitName}' moved to OPEN state after failure in HALF_OPEN. Error: ${error.message}`,
      );
    } else if (circuit.state === CircuitBreakerState.CLOSED) {
      // Check if we should open the circuit
      if (circuit.failureCount >= options.failureThreshold) {
        circuit.state = CircuitBreakerState.OPEN;
        circuit.nextAttemptTime = new Date(
          Date.now() + options.recoveryTimeout,
        );
        this.logger.error(
          `Circuit breaker '${circuitName}' OPENED after ${circuit.failureCount} failures. Next attempt at ${circuit.nextAttemptTime}`,
        );
      }
    }
  }
}
