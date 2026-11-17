/* ---------------------------------------------------------
   Photo fallback, by SKU.

   product-service currently sends `image: null` for every
   product (see services/product-service/scripts/seed-data.js
   in the backend repo), so without this file every card on
   the store shows the drawn ShortsIcon placeholder instead
   of the client's photography.

   This map fills the gap on the frontend. Once the backend
   seed sets a real `image` path, the API value wins and this
   file can be deleted — nothing else imports it.

   Photos live in public/images/natela/ and are the client's
   own shoot, cropped and compressed for web.
   --------------------------------------------------------- */

const BY_SKU = {
  /* The signature printed pair — second shot is the worn angle,
     used for the hover swap on the card. */
  "NF-KOI-001": { image: "/images/natela/shorts-koi.jpg", gallery: ["/images/natela/shorts-worn.jpg"] },
  "NF-FLM-001": { image: "/images/natela/shorts-koi.jpg", gallery: ["/images/natela/shorts-worn.jpg"] },

  /* The plain pair. */
  "NF-KOI-002": { image: "/images/natela/shorts-mono.jpg", gallery: [] },
  "NF-CLS-002": { image: "/images/natela/shorts-mono.jpg", gallery: [] },

  /* Crop top — hover shows the full kit. */
  "NF-TOP-003": { image: "/images/natela/set-crop.jpg", gallery: ["/images/natela/kit-full.jpg"] },
  "NF-TRN-004": { image: "/images/natela/set-crop.jpg", gallery: ["/images/natela/kit-full.jpg"] },

  /* Zip hoodie. */
  "NF-HOD-004": { image: "/images/natela/hoodie.jpg", gallery: [] },
};

/* Returns the product with a photo attached when we have one.
   The API's own `image` is always preferred. */
export function withPhoto(product) {
  const match = BY_SKU[product.sku];
  if (!match) return product;
  return {
    ...product,
    image: product.image || match.image,
    gallery: product.gallery?.length ? product.gallery : match.gallery,
  };
}
