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

/* ---------------------------------------------------------
   The campaign shots used across the store page. These are
   page furniture, not products, so they stay on the frontend
   rather than coming from product-service.

   Files live in public/images/natela/.
   --------------------------------------------------------- */
export const lookbook = [
  { src: "/images/natela/look-1.jpg", alt: "Two athletes in Natela Fit kit on stadium steps" },
  { src: "/images/natela/look-2.jpg", alt: "Natela Fit shorts and crop tops, downtown Calgary" },
  { src: "/images/natela/look-3.jpg", alt: "Pad work in Natela Fit shorts on the turf" },
  { src: "/images/natela/look-4.jpg", alt: "Natela Fit hoodies and shorts against the city" },
];
