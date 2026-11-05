import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  deliveryLabel,
  formatInr,
  isValidPin,
  normalizeMobile,
  priceQuote,
} from "./pricing.ts";

describe("priceQuote", () => {
  const lines = [
    { unitPaise: 125000, qty: 1 },
    { unitPaise: 50000, qty: 2 },
  ];

  it("applies a percent coupon and flat delivery", () => {
    const quote = priceQuote({
      lines,
      coupon: { type: "PERCENT", amount: 10, minSubtotalPaise: 0 },
      shippingMode: "flat",
      shippingPaise: 8000,
      freeShippingPaise: null,
    });
    assert.equal(quote.subtotalPaise, 225000);
    assert.equal(quote.discountPaise, 22500);
    assert.equal(quote.shippingPaise, 8000);
    assert.equal(quote.shippingNote, "flat");
    assert.equal(quote.totalPaise, 210500);
    assert.equal(quote.couponError, null);
  });

  it("caps a fixed coupon at the subtotal", () => {
    const quote = priceQuote({
      lines: [{ unitPaise: 4000, qty: 1 }],
      coupon: { type: "FIXED", amount: 9000, minSubtotalPaise: 0 },
      shippingMode: "confirm",
      shippingPaise: 0,
      freeShippingPaise: null,
    });
    assert.equal(quote.discountPaise, 4000);
    assert.equal(quote.totalPaise, 0);
    assert.equal(quote.shippingNote, "confirm");
  });

  it("refuses a coupon under the minimum and still quotes shipping", () => {
    const quote = priceQuote({
      lines: [{ unitPaise: 10000, qty: 1 }],
      coupon: { type: "PERCENT", amount: 20, minSubtotalPaise: 50000 },
      shippingMode: "flat",
      shippingPaise: 5000,
      freeShippingPaise: null,
    });
    assert.equal(quote.discountPaise, 0);
    assert.ok(quote.couponError);
    assert.equal(quote.totalPaise, 15000);
  });

  it("zeroes delivery above the free-shipping threshold", () => {
    const quote = priceQuote({
      lines: [{ unitPaise: 200000, qty: 1 }],
      coupon: null,
      shippingMode: "flat",
      shippingPaise: 8000,
      freeShippingPaise: 150000,
    });
    assert.equal(quote.shippingNote, "free");
    assert.equal(quote.shippingPaise, 0);
    assert.equal(quote.totalPaise, 200000);
  });
});

describe("indian contact checks", () => {
  it("normalises mobile numbers", () => {
    assert.equal(normalizeMobile("98765 43210"), "9876543210");
    assert.equal(normalizeMobile("+91 87660 67782"), "8766067782");
    assert.equal(normalizeMobile("08766067782"), "8766067782");
    assert.equal(normalizeMobile("12345"), null);
    assert.equal(normalizeMobile("5876543210"), null);
  });

  it("checks PIN codes", () => {
    assert.equal(isValidPin("425201"), true);
    assert.equal(isValidPin("012345"), false);
    assert.equal(isValidPin("42520"), false);
  });
});

describe("labels", () => {
  it("formats rupees and delivery", () => {
    assert.equal(formatInr(125000), "₹1,250");
    assert.equal(deliveryLabel("confirm", 0), "To be confirmed");
    assert.equal(deliveryLabel("free", 0), "Free");
  });
});
