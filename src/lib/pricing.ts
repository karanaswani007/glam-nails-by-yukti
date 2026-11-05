export type CouponMath = {
  type: "PERCENT" | "FIXED";
  amount: number;
  minSubtotalPaise: number;
};

export type ShippingNote = "flat" | "free" | "confirm";

export type PriceQuote = {
  subtotalPaise: number;
  discountPaise: number;
  shippingPaise: number;
  shippingNote: ShippingNote;
  totalPaise: number;
  couponError: string | null;
};

export function formatInr(paise: number): string {
  const rupees = paise / 100;
  const whole = Number.isInteger(rupees);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: whole ? 0 : 2,
  }).format(rupees);
}

export function normalizeMobile(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  const local =
    digits.length === 12 && digits.startsWith("91")
      ? digits.slice(2)
      : digits.length === 11 && digits.startsWith("0")
        ? digits.slice(1)
        : digits;
  return /^[6-9]\d{9}$/.test(local) ? local : null;
}

export function isValidPin(pin: string): boolean {
  return /^[1-9]\d{5}$/.test(pin.trim());
}

export function priceQuote(input: {
  lines: { unitPaise: number; qty: number }[];
  coupon: CouponMath | null;
  shippingMode: "flat" | "confirm";
  shippingPaise: number;
  freeShippingPaise: number | null;
}): PriceQuote {
  const subtotalPaise = input.lines.reduce(
    (sum, line) => sum + Math.max(0, line.unitPaise) * Math.max(0, line.qty),
    0,
  );
  let discountPaise = 0;
  let couponError: string | null = null;
  const coupon = input.coupon;
  if (coupon) {
    if (subtotalPaise < coupon.minSubtotalPaise) {
      couponError = `Add ${formatInr(coupon.minSubtotalPaise - subtotalPaise)} more to use this coupon.`;
    } else if (coupon.type === "PERCENT") {
      const percent = Math.min(100, Math.max(0, coupon.amount));
      discountPaise = Math.min(subtotalPaise, Math.round((subtotalPaise * percent) / 100));
    } else {
      discountPaise = Math.min(subtotalPaise, Math.max(0, coupon.amount));
    }
  }
  const afterDiscount = subtotalPaise - discountPaise;
  const threshold = input.freeShippingPaise;
  let shippingPaise = 0;
  let shippingNote: ShippingNote = "confirm";
  if (threshold && threshold > 0 && afterDiscount >= threshold) {
    shippingPaise = 0;
    shippingNote = "free";
  } else if (input.shippingMode === "flat") {
    shippingPaise = Math.max(0, input.shippingPaise);
    shippingNote = shippingPaise === 0 ? "free" : "flat";
  } else {
    shippingPaise = 0;
    shippingNote = "confirm";
  }
  return {
    subtotalPaise,
    discountPaise,
    shippingPaise,
    shippingNote,
    totalPaise: afterDiscount + shippingPaise,
    couponError,
  };
}

export function deliveryLabel(note: ShippingNote, paise: number): string {
  if (note === "confirm") return "To be confirmed";
  if (note === "free") return "Free";
  return formatInr(paise);
}
