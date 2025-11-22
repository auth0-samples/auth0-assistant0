import { tool } from '@langchain/core/tools';
import { z } from 'zod';

import { getAsyncAuthorizationCredentials } from '@auth0/ai-langchain';

export const shopOnlineTool = tool(
  async ({ product, qty, priceLimit }) => {
    console.log(`Ordering ${qty} ${product} with price limit ${priceLimit}`);

    const apiUrl = process.env['SHOP_API_URL']!;

    if (!apiUrl) {
      // No API set, mock a response
      return `Ordered ${qty} ${product}`;
    }

    const headers = {
      'Content-Type': 'application/json',
      Authorization: '',
    };
    const body = {
      product,
      qty,
      priceLimit,
    };

    const credentials = getAsyncAuthorizationCredentials();
    const accessToken = credentials?.accessToken;

    if (accessToken) {
      headers['Authorization'] = 'Bearer ' + accessToken;
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(body),
    });

    return response.statusText;
  },
  {
    name: 'shop_online',
    description: 'Tool to buy products online',
    schema: z.object({
      product: z.string(),
      qty: z.number(),
      priceLimit: z.number().optional(),
    }),
  },
);
