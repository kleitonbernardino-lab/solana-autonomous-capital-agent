import { AceDataServiceRequest } from '../types/index.js';

export class AceDataCloudClient {
  private readonly apiKey: string;
  private readonly serviceHistory: AceDataServiceRequest[] = [];

  constructor(apiKey = 'demo_ace_key') {
    this.apiKey = apiKey;
  }

  public async executeSearch(query: string): Promise<AceDataServiceRequest> {
    const requestId = `ace_srch_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const request: AceDataServiceRequest = {
      serviceType: 'search',
      query,
      creditsCharged: 1, // 1 paid Ace credit
      requestId,
      status: 'completed',
      result: {
        summary: `Market intelligence briefing for query: "${query}"`,
        solanaSentiment: 'bullish',
        relevantProtocols: ['Kamino', 'MultiHopper', 'Meteora'],
        timestamp: new Date().toISOString()
      }
    };

    this.serviceHistory.push(request);
    return request;
  }

  public async executeBriefing(topic: string): Promise<AceDataServiceRequest> {
    const requestId = `ace_brf_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const request: AceDataServiceRequest = {
      serviceType: 'briefing',
      query: topic,
      creditsCharged: 2,
      requestId,
      status: 'completed',
      result: {
        topic,
        executiveSummary: `Autonomous rebalance telemetry validated on-chain with multi-hop liquidity routing.`,
        signals: [
          { protocol: 'Kamino', signal: 'Deposit APY surge (+1.8%)' },
          { protocol: 'Meteora', signal: 'Volume expansion in dynamic pools' }
        ]
      }
    };

    this.serviceHistory.push(request);
    return request;
  }

  public getPaidRequestCount(): number {
    return this.serviceHistory.filter(r => r.status === 'completed' && r.creditsCharged > 0).length;
  }

  public getHistory(): AceDataServiceRequest[] {
    return [...this.serviceHistory];
  }
}
