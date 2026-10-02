import {handleGoogleReviews} from './server/google-reviews.js';
import {handleFlightPrices} from './server/flights.js';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/google-reviews') return handleGoogleReviews(request, env);
    if (url.pathname === '/api/flight-prices') return handleFlightPrices(request, env);
    if (url.pathname.startsWith('/api/')) return Response.json({error: 'Route inconnue.'}, {status: 404});
    return env.ASSETS.fetch(request);
  },
};
