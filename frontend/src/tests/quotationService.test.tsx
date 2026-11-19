import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from '../services/api';
import { createQuotation } from '../services/quotationService';

vi.mock('../services/api', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

describe('quotationService (Unit)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('converts string eventId into a numeric payload object', async () => {
    (api.post as any).mockResolvedValueOnce({ data: { id: 42, totalCost: 12000 } });

    const result = await createQuotation('7');

    expect(api.post).toHaveBeenCalledWith('/quotations', { eventId: 7 });
    expect(result).toEqual({ id: 42, totalCost: 12000 });
  });
});