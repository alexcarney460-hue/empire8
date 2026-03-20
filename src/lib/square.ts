import { SquareClient, SquareEnvironment } from 'square';

const accessToken = process.env.SQUARE_ACCESS_TOKEN?.trim();
const isProd = process.env.SQUARE_ENVIRONMENT?.trim() === 'production';

export const squareClient = accessToken
  ? new SquareClient({
      token: accessToken,
      environment: isProd ? SquareEnvironment.Production : SquareEnvironment.Sandbox,
    })
  : null;

export const SQUARE_LOCATION_ID = process.env.SQUARE_LOCATION_ID?.trim() ?? '';

// 10% additional discount for Subscribe & Save on top of tier pricing
export const AUTOSHIP_DISCOUNT = 0.10;
