# Natela Fit — Storefront

Frontend for the Natela Fit capstone project. Three working pages, built to the
client's brand guidelines and their Lululemon / Athena Fightwear reference.

| Ticket | Page | Route |
|---|---|---|
| SCRUM-8 | Store page | `/` |
| SCRUM-5 | Cart | `/cart` |
| SCRUM-12 | Admin page | `/admin` |

---

## Run it

You need Node.js (LTS) from nodejs.org. Then:

```bash
npm install
npm run dev
```

Open the address it prints. That's it.

Other commands: `npm run build` makes the production files, `npm run preview`
serves that build locally.

---

## What actually works

Nothing here is a picture — every one of these does something:

- **Store** — browse products, filter by sport, pick a size, add to cart.
  Out-of-stock sizes are disabled and struck through. Sale prices show the old
  price crossed out. Products with no reviews hide the star rating.
- **Cart** — change quantities, remove lines, and see the $30 bundle discount
  apply automatically once there are two items. Totals (bundle, shipping,
  GST) recalculate live. Guest checkout only — the client does not want
  customer accounts.
- **Admin** — add a product and it appears on the store immediately. Edit one,
  delete one, save something as a draft (drafts stay off the storefront).
  Stock is tracked per size and drives the disabled size buttons on the store.

The cart and the catalogue survive a page refresh, because they're saved to
`localStorage`. That's a stand-in for the backend, not a replacement — see below.

---

## How it's put together

```
src/
  components/   reusable pieces — ProductCard, Header, Footer, Stars
  pages/        one file per screen — Store, Cart, Admin
  context/      shared state — ProductsContext, CartContext
  data/         fake product data (stands in for the API)
  lib/          localStorage helper
  styles/       tokens.css (all brand values) + global.css
```

Two pieces of shared state, deliberately split the same way the backend is:

- **`ProductsContext`** ≈ `product-service` — the catalogue. Both the store and
  the admin read from it, which is why adding a product in the admin shows up on
  the store straight away.
- **`CartContext`** ≈ `order-service` — the cart lines and all the money maths.

---

## Connecting this to the real services

Right now the data comes from `src/data/products.js`. When the backend is live:

1. Put the gateway address in a `.env` file at the project root:

   ```
   VITE_API_URL=https://your-gateway.azurecontainerapps.io
   ```

2. In `ProductsContext.jsx`, replace the `useState` seed with a fetch:

   ```js
   useEffect(() => {
     fetch(`${import.meta.env.VITE_API_URL}/products`)
       .then((r) => r.json())
       .then(setProducts)
       .catch(() => setProducts([]));   // handle the failure case
   }, []);
   ```

3. Make `addProduct`, `updateProduct` and `deleteProduct` call `POST`, `PUT` and
   `DELETE` instead of `setState`, and drop the `localStorage` calls from that file.

4. Recalculate the cart totals **on the server** as well. Anything worked out in
   the browser can be edited by the customer — never trust a price that came
   from the frontend.

Everything else stays as it is, because every screen reads through the contexts
rather than fetching for itself.

**Expect a CORS error on your first real call.** It looks like your code is
broken; it isn't. Whoever owns the gateway has to allow your frontend's address.

---

## Before this goes in front of the client

- **Logo** — the "NATELA" wordmark is set in Poppins as a stand-in. Their
  guidelines forbid redrawing or distorting the logo, so get the real file from
  the owners and use it. Colour version on white or black only.
- **Photography** — every product image is a grey placeholder. This design is
  photo-led; it will not read properly until real photos are in.
- **Copy** — product names, descriptions and the collection story are drafted,
  not approved. The client needs to sign off or rewrite them.

---

## Brand reference

Straight from the Natela Fit guidelines, and all set in `src/styles/tokens.css`:

| | |
|---|---|
| Red | `#E93E3A` |
| Orange | `#FBB040` |
| Yellow | `#FFF200` |
| Black | `#000000` |
| White | `#FFFFFF` |
| Font | Poppins SemiBold (Montserrat / Roboto as substitutes) |

The orange-to-red gradient is the brand signature — it's `--brand-gradient` and
is used on primary buttons, badges and the cart count.

---

## Still to build

- Checkout and order confirmation (`order-service`)
- Admin login (`auth-service`) — and note that hiding the admin route is **not**
  security; every admin endpoint has to check the role on the server
- The AI recommendation service. The "Complete your kit" row at the bottom of
  the cart is where it plugs in — it currently suggests products not already in
  the cart, which is a placeholder, not the real thing.
