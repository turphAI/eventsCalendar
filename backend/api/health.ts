/**
 * Health check endpoint
 */

import { VercelRequest, VercelResponse } from '@vercel/node';
import { ApiResponse } from '../types';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  const response: ApiResponse<{ status: string; timestamp: string }> = {
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
    },
    timestamp: new Date().toISOString(),
  };

  res.status(200).json(response);
}
