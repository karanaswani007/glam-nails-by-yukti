import { deliveryLabel, formatInr, type ShippingNote } from "./pricing.ts";

export const DEFAULT_WHATSAPP = "918766067782";

export function digitsOnly(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 10) return `91${digits}`;
  return digits || DEFAULT_WHATSAPP;
}

export function whatsappHref(number: string, message: string): string {
  return `https://wa.me/${digitsOnly(number)}?text=${encodeURIComponent(message)}`;
}

export type OrderMessageInput = {
  orderNumber: string;
  customerName: string;
  lines: {
    name: string;
    qty: number;
    shape: string;
    length: string;
    sizing: string;
  }[];
  subtotalPaise: number;
  discountPaise: number;
  shippingPaise: number;
  shippingNote: ShippingNote;
  totalPaise: number;
  addressLines: string[];
};

export function buildOrderMessage(input: OrderMessageInput): string {
  const products = input.lines
    .map((line) =>
      [
        line.name,
        `Quantity: ${line.qty}`,
        `Size: ${line.shape}, ${line.length}, ${line.sizing}`,
      ].join("\n"),
    )
    .join("\n\n");
  const discount =
    input.discountPaise > 0 ? `\nDiscount: ${formatInr(input.discountPaise)}` : "";
  return [
    "Hello Glam Nails by Yukti!",
    "I would like to confirm my order.",
    "",
    `Order ID: ${input.orderNumber}`,
    `Customer Name: ${input.customerName}`,
    "",
    "Products:",
    products,
    "",
    `Subtotal: ${formatInr(input.subtotalPaise)}${discount}`,
    `Delivery: ${deliveryLabel(input.shippingNote, input.shippingPaise)}`,
    `Total: ${formatInr(input.totalPaise)}`,
    "Payment status: Unpaid",
    "",
    "Delivery Address:",
    input.addressLines.filter(Boolean).join("\n"),
    "",
    "Please share payment confirmation details.",
    "Thank you!",
  ].join("\n");
}

export function buildProductEnquiry(input: {
  name: string;
  productId: string;
  shape: string;
  length: string;
  sizing: string;
  pricePaise: number;
  path: string;
}): string {
  return [
    "Hello Glam Nails by Yukti!",
    "I would like to enquire about a design.",
    "",
    `Product: ${input.name}`,
    `Product ID: ${input.productId}`,
    `Shape: ${input.shape}`,
    `Length: ${input.length}`,
    `Sizing: ${input.sizing}`,
    `Price: ${formatInr(input.pricePaise)}`,
    `Page: ${input.path}`,
  ].join("\n");
}

export function buildCustomMessage(input: {
  number: string;
  name: string;
  shape: string;
  length: string;
  colors: string;
  category: string;
  occasion: string;
  budget: string;
}): string {
  return [
    "Hello Glam Nails by Yukti!",
    "I sent a custom nail request.",
    "",
    `Request: ${input.number}`,
    `Name: ${input.name}`,
    `Shape: ${input.shape}`,
    `Length: ${input.length}`,
    `Colours: ${input.colors}`,
    `Category: ${input.category}`,
    `Occasion: ${input.occasion}`,
    input.budget ? `Budget: ${input.budget}` : "",
  ]
    .filter((line) => line !== "")
    .join("\n");
}

export function buildAppointmentMessage(input: {
  number: string;
  name: string;
  service: string;
  date: string;
  time: string;
}): string {
  return [
    "Hello Glam Nails by Yukti!",
    "I sent a salon appointment enquiry. This is not a confirmed booking.",
    "",
    `Enquiry: ${input.number}`,
    `Name: ${input.name}`,
    `Service: ${input.service}`,
    `Preferred date: ${input.date}`,
    `Preferred time: ${input.time}`,
  ].join("\n");
}
