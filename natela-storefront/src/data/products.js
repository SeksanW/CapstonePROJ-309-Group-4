/* ---------------------------------------------------------
   Shared constants for the storefront. The products themselves
   now come from product-service (see ProductsContext.jsx).

   SIZES and the sport names must match packages/shared/src/catalog.js
   in the backend repo.
   --------------------------------------------------------- */

export const SIZES = ["S", "M", "L", "XL"];

export const sports = [
  { name: "Muay Thai", slug: "muay-thai" },
  { name: "Boxing", slug: "boxing" },
  { name: "MMA", slug: "mma" },
  { name: "Training", slug: "training" },
];

export const helpLinks = [
  { title: "Size guide", sub: "Measurements and fit notes for every cut" },
  { title: "Shipping", sub: "Worldwide delivery times and costs" },
  { title: "Returns", sub: "30 days, unworn, tags attached" },
  { title: "FAQ", sub: "Care, fabric and order questions" },
];
