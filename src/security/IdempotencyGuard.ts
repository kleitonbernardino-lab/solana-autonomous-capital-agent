import { createHash } from 'node:crypto';
import { IdempotencyRecord } from '../types/index.js';

export class DuplicateExecutionError extends Error {
  constructor(public readonly payloadHash: string, public readonly existingSignature: string) {
    super(`Idempotency violation: Payload hash ${payloadHash} already executed with signature ${existingSignature}`);
    this.name = 'DuplicateExecutionError';
  }
}

export class IdempotencyGuard {
  private readonly records = new Map<string, IdempotencyRecord>();
  private readonly ttlMs: number;

  constructor(ttlMs = 3600_000) {
    this.ttlMs = ttlMs;
  }

  public computeHash(payload: unknown): string {
    const serialized = typeof payload === 'string' ? payload : JSON.stringify(payload);
    return createHash('sha256').update(serialized).digest('hex');
  }

  public registerIntent(payloadHash: string): void {
    this.cleanupExpired();
    const existing = this.records.get(payloadHash);
    if (existing && existing.status !== 'failed') {
      throw new DuplicateExecutionError(payloadHash, existing.txSignature);
    }

    this.records.set(payloadHash, {
      payloadHash,
      txSignature: 'pending',
      status: 'pending',
      timestamp: Date.now()
    });
  }

  public confirmExecution(payloadHash: string, txSignature: string): void {
    const record = this.records.get(payloadHash);
    if (record) {
      record.txSignature = txSignature;
      record.status = 'confirmed';
    } else {
      this.records.set(payloadHash, {
        payloadHash,
        txSignature,
        status: 'confirmed',
        timestamp: Date.now()
      });
    }
  }

  public markFailed(payloadHash: string): void {
    const record = this.records.get(payloadHash);
    if (record) {
      record.status = 'failed';
    }
  }

  public isExecuted(payloadHash: string): boolean {
    const record = this.records.get(payloadHash);
    return !!record && record.status === 'confirmed';
  }

  private cleanupExpired(): void {
    const now = Date.now();
    for (const [hash, record] of this.records.entries()) {
      if (now - record.timestamp > this.ttlMs) {
        this.records.delete(hash);
      }
    }
  }
}
