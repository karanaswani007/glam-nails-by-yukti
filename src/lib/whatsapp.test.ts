import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildOrderMessage, whatsappHref } from "./whatsapp.ts";

describe("whatsapp order message", () => {
  it("includes the order id, variants and unpaid status", () => {
    const message = buildOrderMessage({
      orderNumber: "GN-TEST01",
      customerName: "Asha",
      lines: [
        {
          name: "Blush Pearl",
          qty: 1,
          shape: "Almond",
          length: "Medium",
          sizing: "Standard set",
        },
      ],
      subtotalPaise: 125000,
      discountPaise: 0,
      shippingPaise: 0,
      shippingNote: "confirm",
      totalPaise: 125000,
      addressLines: ["12 Rose Lane", "Bhusawal, Maharashtra 425201"],
    });
    assert.match(message, /Order ID: GN-TEST01/);
    assert.match(message, /Customer Name: Asha/);
    assert.match(message, /Blush Pearl/);
    assert.match(message, /Size: Almond, Medium, Standard set/);
    assert.match(message, /Delivery: To be confirmed/);
    assert.match(message, /Payment status: Unpaid/);
    assert.doesNotMatch(message, /Payment status: Paid/);
  });

  it("encodes the click-to-chat link", () => {
    const href = whatsappHref("918766067782", "Hello Glam");
    assert.equal(href, "https://wa.me/918766067782?text=Hello%20Glam");
  });
});
