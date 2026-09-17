import { BookingPriceBreakdown, Vendor } from '../types';
import { DEFAULT_RENTAL_RULES } from './constants';

export interface CalculateRentalParams {
  pickupDatetime: string;
  returnDatetime: string;
  dailyPrice: number;
  securityDeposit: number;
  deliveryFee?: number;
  vendor?: Partial<Vendor>; // Vendor's settings
}

/**
 * Calculates rental pricing based on either 24-hour block intervals or Day Rental rules.
 */
export function calculateRentalPricing(params: CalculateRentalParams): {
  isValid: boolean;
  error?: string;
  breakdown: BookingPriceBreakdown;
} {
  const { pickupDatetime, returnDatetime, dailyPrice, securityDeposit, deliveryFee = 0, vendor } = params;

  if (!pickupDatetime || !returnDatetime) {
    return createEmptyBreakdown(params, 'Pickup and return dates are required');
  }

  const pickupDate = new Date(pickupDatetime);
  const returnDate = new Date(returnDatetime);
  const start = pickupDate.getTime();
  const end = returnDate.getTime();

  if (isNaN(start) || isNaN(end)) {
    return createEmptyBreakdown(params, 'Invalid date format');
  }

  const diffMs = end - start;
  if (diffMs <= 0) {
    return createEmptyBreakdown(params, 'Return date & time must be strictly after pickup date & time');
  }

  // Duration in hours
  const diffHours = diffMs / (1000 * 60 * 60);

  // Check Vendor Settings
  const rentalCalculationMode = vendor?.rentalCalculationMode || '24_hour';
  let chargeableDays = 0;
  let extraHours = 0;
  let lateFee = 0;

  if (rentalCalculationMode === 'day_rental') {
    // === DAY RENTAL CALCULATION ===
    // Calendar days difference + 1
    const startMidnight = new Date(pickupDate.getFullYear(), pickupDate.getMonth(), pickupDate.getDate());
    const endMidnight = new Date(returnDate.getFullYear(), returnDate.getMonth(), returnDate.getDate());
    const daysDiff = Math.round((endMidnight.getTime() - startMidnight.getTime()) / (1000 * 60 * 60 * 24));
    
    chargeableDays = Math.max(1, daysDiff + 1);

    if (vendor?.overnightRentalAllowed === false && chargeableDays > 1) {
      return createEmptyBreakdown(params, 'Overnight rentals are not allowed for this vehicle.');
    }

    // Parse vendor end time (e.g. "19:00")
    const dayRentalEndTime = vendor?.dayRentalEndTime || '19:00';
    const [endHourStr, endMinStr] = dayRentalEndTime.split(':');
    const vendorEndHour = parseInt(endHourStr, 10);
    const vendorEndMin = parseInt(endMinStr, 10);

    // Calculate customer's return time in minutes from midnight
    const returnTimeMinutes = returnDate.getHours() * 60 + returnDate.getMinutes();
    const vendorEndTimeMinutes = vendorEndHour * 60 + vendorEndMin;
    const gracePeriodMinutes = vendor?.gracePeriodMinutes || 0;

    // Check if late on the final day
    if (returnTimeMinutes > vendorEndTimeMinutes + gracePeriodMinutes) {
      // Late return logic
      const lateReturnPolicy = vendor?.lateReturnPolicy || 'extra_hour';
      if (lateReturnPolicy === 'extra_day') {
        chargeableDays += 1;
      } else if (lateReturnPolicy === 'extra_hour') {
        const extraMinutes = returnTimeMinutes - vendorEndTimeMinutes;
        extraHours = Math.ceil(extraMinutes / 60);
        lateFee = extraHours * (vendor?.extraHourPrice || 0);
      } else if (lateReturnPolicy === 'custom_fee') {
        lateFee = vendor?.customLateFeeAmount || 0;
      }
    }
  } else {
    // === 24-HOUR CALCULATION ===
    chargeableDays = Math.max(1, Math.ceil(diffHours / 24));
    if (vendor?.overnightRentalAllowed === false && chargeableDays > 1) {
      return createEmptyBreakdown(params, 'Overnight rentals are not allowed for this vehicle.');
    }
  }

  const subtotalAmount = Math.round(chargeableDays * dailyPrice);
  const totalEstimatedAmount = Math.round(subtotalAmount + deliveryFee + securityDeposit + lateFee);

  return {
    isValid: true,
    breakdown: {
      dailyRate: dailyPrice,
      daysCount: chargeableDays,
      totalHours: Number(diffHours.toFixed(1)),
      subtotalAmount,
      deliveryFee,
      securityDeposit,
      totalEstimatedAmount,
      durationRule: rentalCalculationMode === 'day_rental' ? 'Day Rental' : DEFAULT_RENTAL_RULES.durationRule,
      rentalCalculationMode,
      rentalStartTime: vendor?.dayRentalStartTime || '07:00',
      rentalEndTime: vendor?.dayRentalEndTime || '19:00',
      chargeableDays,
      extraHours,
      lateFee,
      estimatedTotal: totalEstimatedAmount,
    },
  };
}

function createEmptyBreakdown(params: CalculateRentalParams, error: string) {
  return {
    isValid: false,
    error,
    breakdown: {
      dailyRate: params.dailyPrice,
      daysCount: 0,
      totalHours: 0,
      subtotalAmount: 0,
      deliveryFee: params.deliveryFee || 0,
      securityDeposit: params.securityDeposit,
      totalEstimatedAmount: 0,
      durationRule: DEFAULT_RENTAL_RULES.durationRule,
      rentalCalculationMode: params.vendor?.rentalCalculationMode || '24_hour',
      chargeableDays: 0,
      extraHours: 0,
      lateFee: 0,
      estimatedTotal: 0,
    },
  };
}
