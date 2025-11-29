import { z } from 'zod';
import { TICKERS } from './types';

export const TickerSchema = z.enum(['SANTA', 'REIN', 'ELF', 'COAL', 'GIFT']);

export const OrderSchema = z.object({
  ticker: TickerSchema,
  action: z.enum(['BUY', 'SELL']),
  quantity: z.number().int().positive(),
});

export const AgentOutputSchema = z.object({
  orders: z.array(OrderSchema),
});

export type AgentOutput = z.infer<typeof AgentOutputSchema>;

export function parseAgentOutput(raw: string): AgentOutput | null {
  try {
    // Strip markdown code fences if present
    let cleaned = raw.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    const parsed = JSON.parse(cleaned);
    const result = AgentOutputSchema.safeParse(parsed);

    if (result.success) {
      return result.data;
    }
    return null;
  } catch {
    return null;
  }
}
