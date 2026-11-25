import { tick, d1Store } from './core.js';
export default {
  async scheduled(controller, env) {
    try {
      // Wall clock, rather than scheduledTime: delayed triggers must not enqueue
      // yesterday's reminder after local midnight.
      await tick({ env, store: d1Store(env.SI_DB) });
    } catch {
      console.error(JSON.stringify({ event: 'failed', code: 'SCHEDULER_FAILURE' }));
      // Surface failure to Cloudflare. A later cron retries the same daily key.
      throw new Error('SPIRIT_SCHEDULER_FAILURE');
    }
  },
  async fetch() {
    // No public admin, simulation, destination selection or send endpoint.
    return new Response('Not found', { status: 404 });
  },
};
