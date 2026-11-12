import { OobeSapToolCall, OobeSapToolResult } from '../types/index.js';

export class OobeSapClient {
  private readonly baseUrl: string;
  private readonly toolRegistry = new Set<string>([
    'jupiter_swap',
    'kamino_deposit',
    'kamino_borrow',
    'meteora_dynamic_vault',
    'orca_whirlpool_swap',
    'adrena_perpetual_open',
    'magicblock_private_transfer',
    'multihopper_route_transfer'
  ]);

  constructor(baseUrl = 'https://sap.oobeprotocol.ai/mcp/v1') {
    this.baseUrl = baseUrl;
  }

  public isToolSupported(toolName: string): boolean {
    return this.toolRegistry.has(toolName);
  }

  public async executeTool(call: OobeSapToolCall): Promise<OobeSapToolResult> {
    const startTime = Date.now();

    if (!this.isToolSupported(call.toolName)) {
      return {
        success: false,
        toolName: call.toolName,
        output: null,
        executionTimeMs: Date.now() - startTime,
        error: `Tool ${call.toolName} is not registered in OOBE SAP MCP catalogue`
      };
    }

    // Mock execution adapter simulating high-fidelity SAP runtime
    const mockOutput = {
      status: 'executed',
      protocol: call.toolName.split('_')[0],
      action: call.toolName,
      params: call.params,
      timestamp: new Date().toISOString(),
      clusterConfirmation: 'confirmed'
    };

    return {
      success: true,
      toolName: call.toolName,
      output: mockOutput,
      executionTimeMs: Date.now() - startTime
    };
  }

  public getAvailableTools(): string[] {
    return Array.from(this.toolRegistry);
  }
}
