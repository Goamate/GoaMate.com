import { BookingPriceBreakdown } from '../types';
import { DEFAULT_RENTAL_RULES } from './constants';

export interface CalculateRentalParams {
  pickupDatetime: string;
  returnDatetime: string;
  dailyPrice: number;
  securityDeposit: number;
  deliveryFee?: number;
}

/**
 * Calculates rental pricing based on 24-hour block intervals.
 * Any started 24-hour period counts as a full day.
 */
export function calculateRentalPricing(params: CalculateRentalParams): {
  isValid: boolean;
  error?: string;
  breakdown: BookingPriceBreakdown;
} {
  const { pickupDatetime, returnDatetime, dailyPrice, securityDeposit, deliveryFee = 0 } = params;

  if (!pickupDatetime || !returnDatetime) {
    return {
      isValid: false,
      error: 'Pickup and return dates are required',
      breakdown: {
        dailyRate: dailyPrice,
        daysCount: 0,
        totalHours: 0,
        subtotalAmount: 0,
        deliveryFee: 0,
        securityDeposit,
        totalEstimatedAmount: 0,
        durationRule: DEFAULT_RENTAL_RULES.durationRule,
      },
    };
  }

  const start = new Date(pickupDatetime).getTime();
  const end = new Date(returnDatetime).getTime();

  if (isNaN(start) || isNaN(end)) {
    return {
      isValid: false,
      error: 'Invalid date format',
      breakdown: {
        dailyRate: dailyPrice,
        daysCount: 0,
        totalHours: 0,
        subtotalAmount: 0,
        deliveryFee: 0,
        securityDeposit,
        totalEstimatedAmount: 0,
        durationRule: DEFAULT_RENTAL_RULES.durationRule,
      },
    };
  }

  const diffMs = end - start;
  if (diffMs <= 0) {
    return {
      isValid: false,
      error: 'Return date & time must be strictly after pickup date & time',
      breakdown: {
        dailyRate: dailyPrice,
        daysCount: 0,
        totalHours: 0,
        subtotalAmount: 0,
        deliveryFee: 0,
        securityDeposit,
        totalEstimatedAmount: 0,
        durationRule: DEFAULT_RENTAL_RULES.durationRule,
      },
    };
  }

  // Duration in hours
  const diffHours = diffMs / (1000 * 60 * 60);
  // Each started 24-hour period is charged as 1 day
  const daysCount = Math.max(1, Math.ceil(diffHours / 24));
  const subtotalAmount = Math.round(daysCount * dailyPrice);
  const totalEstimatedAmount = Math.round(subtotalAmount + deliveryFee + securityDeposit);

  return {
    isValid: true,
    breakdown: {
      dailyRate: dailyPrice,
      daysCount,
      totalHours: Number(diffHours.toFixed(1)),
      subtotalAmount,
      deliveryFee,
      securityDeposit,
      totalEstimatedAmount,
      durationRule: DEFAULT_RENTAL_RULES.durationRule,
    },
  };
}
