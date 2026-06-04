import { HutkoCallbackPayload } from 'hutko-node-js-sdk';

/** Hutko может прислать callback как JSON, form POST или обёртку response */
export function normalizeHutkoCallback(
  body: Record<string, unknown> | HutkoCallbackPayload,
): HutkoCallbackPayload {
  if (!body || typeof body !== 'object') {
    return {};
  }

  const nested = body.response;
  if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
    return nested as HutkoCallbackPayload;
  }

  return body as HutkoCallbackPayload;
}
