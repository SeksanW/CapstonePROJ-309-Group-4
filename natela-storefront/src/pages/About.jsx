import { useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useProducts } from "../context/ProductsContext";
import { usePageContent } from "../context/PageContentContext";
import ProductCard from "../components/ProductCard";

/* /about — the "About us" page. Reached from the menu's "About us" and
   the footer's "Our story".

   Sections, top to bottom: founders' letter beside their photo; brush
   divider; pull quote; "Every pair is…" values; photo + headline;
   scrolling tagline; the watercolour design; the koi's meanings; meet the
   founders; shop the collection; back to the store.

   Every text and photo is editable in the admin site (Main page edits →
   About us page, stored as page content `about`). Anything left empty
   there uses the built-in default below. */

export const ABOUT_DEFAULTS = {
  introImage: "/images/story/story-01.jpg",
  introHeading: "Serving to unleash the everyday warrior in you.",
  introSub: "Built for the ring. Made to last.",
  letter: [
    "We, Natalia & Elissa, are not building a community. We are part of one. As women who fell in love with the sport, we love everything Muay Thai represents: the strength, discipline, confidence, resilience and community.",
    "But when it came to fighter apparel, something was missing.",
    "We wanted shorts that celebrated and nurtured both sides of us, and acknowledged the everyday internal and external battles we face.",
    "Natela is a combination of our names, which in Aramaic means light, brightness and hope. That's what we want you to feel every time you step into the ring.",
  ].join("\n\n"),
  signature: "XO,\nNatalia & Elissa",
  quoteTag: "365 Warrior",
  quote:
    "You are the true hero fighting your own mind. When you wear our products, you are transformed and feel like the everyday warrior you are.",
  quoteBy: "Natalia & Elissa",
  valuesHeading: "Every pair is…",
  value1Title: "Wearable art",
  value1Text: "Original watercolour koi, a badge of honour inside and outside the ring.",
  value2Title: "Thoughtful fits",
  value2Text: "A women's Muay Thai brand, built around how you train.",
  value3Title: "Beautiful materials",
  value3Text: "Airy, light and breathable. Perfect for performance training.",
  value4Title: "Strong and feminine",
  value4Text: "Powerful and artistic, graceful and fierce.",
  splitImage: "/images/story/story-02.jpg",
  splitHeadline: "Strong and feminine. Powerful and artistic. Graceful and fierce.",
  marquee: "Unleash your everyday warrior",
  designImage: "/images/design/design-02.jpg",
  designHeading: "Wearable art, not graphic print.",
  designBody:
    "A unique watercolour koi design created for women's Muay Thai shorts, with fluid brushwork, soft yet vibrant colour transitions and organic details. Each koi has the character of a hand-painted piece, giving every pair an artistic, one-of-a-kind look.",
  designButton: "Shop now",
  koiHeading: "The koi",
  koiIntro:
    "Our koi are painted to look authentic, with watercolour and acrylic brush marks. We chose vibrant, juicy colours to bring out the inner warrior strength inside all of us. Each one stands for:",
  koiImage: "/images/design/design-01.jpg",
  koiMeanings: "Evolution, Ambition, Balance, Good fortune, Prosperity",
  foundersHeading: "Meet Natalia & Elissa",
  foundersImage: "/images/story/story-06.jpg",
  foundersQuote: "We are not building a community. We are part of one.",
  foundersName: "Natalia & Elissa",
  foundersRole: "Founders, Natela Fit",
  foundersBody:
    "Our vision became a women's Muay Thai brand built around thoughtful fits, beautiful materials and original artwork. Instead of treating shorts as just another piece of training gear, we wanted each design to feel like wearable art and a badge of honour, inside and outside the ring.",
  shopHeading: "Shop the collection",
};

// Admin values win, but only when actually filled in.
function withDefaults(saved) {
  const out = { ...ABOUT_DEFAULTS };
  for (const [k, v] of Object.entries(saved || {})) {
    if (typeof v === "string" && v.trim()) out[k] = v;
  }
  return out;
}

const paragraphs = (text) => text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
const withBreaks = (text) =>
  text.split("\n").map((line, i) => (
    <span key={i}>
      {i > 0 && <br />}
      {line}
    </span>
  ));

export default function About() {
  const navigate = useNavigate();
  const { products } = useProducts();
  const { content } = usePageContent();
  const a = useMemo(() => withDefaults(content.about), [content.about]);
  const live = useMemo(() => products.filter((p) => p.status === "live").slice(0, 4), [products]);

  const values = [1, 2, 3, 4]
    .map((n) => ({ title: a[`value${n}Title`], text: a[`value${n}Text`] }))
    .filter((v) => v.title || v.text);
  const meanings = a.koiMeanings.split(/[,\n]/).map((m) => m.trim()).filter(Boolean);

  // Land at the top, not wherever the previous page was scrolled to.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // "Shop" links: back to the homepage's product grid.
  function goShop(e) {
    e.preventDefault();
    navigate("/");
    let tries = 0;
    const scroll = () => {
      const el = document.getElementById("new");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      else if (tries++ < 30) requestAnimationFrame(scroll);
    };
    requestAnimationFrame(scroll);
  }

  return (
    <div className="about">
      {/* 1. Founders' letter */}
      <section className="page about-intro">
        <div className="about-intro__photo">
          <img src={a.introImage} alt={a.foundersName} />
        </div>
        <div className="about-intro__text">
          <h1 className="about-h1">{a.introHeading}</h1>
          <p className="about-sub">{a.introSub}</p>
          <div className="about-letter">
            {paragraphs(a.letter).map((p, i) => (
              <p key={i}>{withBreaks(p)}</p>
            ))}
            <p className="about-letter__sign">{withBreaks(a.signature)}</p>
          </div>
        </div>
      </section>

      {/* 2. Brush divider */}
      <div className="about-divider" aria-hidden="true">
        <svg viewBox="0 0 1200 40" preserveAspectRatio="none">
          <defs>
            <linearGradient id="about-brush" x1="0" x2="1">
              <stop offset="0" stopColor="#FBB040" />
              <stop offset="1" stopColor="#E93E3A" />
            </linearGradient>
          </defs>
          <path
            d="M10 24 C 160 6, 300 36, 460 20 S 760 4, 900 22 S 1120 34, 1190 16"
            fill="none"
            stroke="url(#about-brush)"
            strokeWidth="6"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* 3. Pull quote */}
      <section className="page about-quote">
        <p className="about-quote__tag">{a.quoteTag}</p>
        <blockquote>
          <p>“{a.quote}”</p>
          <footer>{a.quoteBy}</footer>
        </blockquote>
      </section>

      {/* 4. Values */}
      {values.length > 0 && (
        <section className="page about-values">
          <h2 className="about-h2">{a.valuesHeading}</h2>
          <ul>
            {values.map((v, i) => (
              <li key={i}>
                <strong>{v.title}</strong>
                <span>{v.text}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 5. Photo + headline */}
      <section className="page about-split">
        <img src={a.splitImage} alt="" />
        <h2 className="about-display">{a.splitHeadline}</h2>
      </section>

      {/* 6. Scrolling tagline */}
      <div className="about-marquee" aria-label={a.marquee}>
        <div className="about-marquee__track" aria-hidden="true">
          {Array.from({ length: 2 }).map((_, half) => (
            <span key={half} className="about-marquee__half">
              {Array.from({ length: 6 }).map((__, i) => (
                <span key={i}>
                  {a.marquee}
                  <span className="about-marquee__dot">✦</span>
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* 7. The design */}
      <section className="page about-design">
        <img src={a.designImage} alt="" />
        <div>
          <h2 className="about-h2">{a.designHeading}</h2>
          {paragraphs(a.designBody).map((p, i) => (
            <p key={i} className="about-body">
              {withBreaks(p)}
            </p>
          ))}
          <a href="/#new" className="btn btn--grad" onClick={goShop}>
            {a.designButton}
          </a>
        </div>
      </section>

      {/* 8. The koi's meanings */}
      <section className="page about-koi">
        <h2 className="about-eyebrow">{a.koiHeading}</h2>
        <p className="about-body about-koi__intro">{a.koiIntro}</p>
        <div className="about-koi__layout">
          <img src={a.koiImage} alt="" />
          <ol>
            {meanings.map((m, i) => (
              <li key={i}>
                <span className="about-koi__num">{String(i + 1).padStart(2, "0")}</span>
                <span className="about-koi__word">{m}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 9. Meet the founders */}
      <section className="page about-founders">
        <h2 className="about-eyebrow">{a.foundersHeading}</h2>
        <div className="about-founders__layout">
          <img src={a.foundersImage} alt={a.foundersName} />
          <div>
            <p className="about-founders__quote">“{a.foundersQuote}”</p>
            <p className="about-founders__name">
              <strong>{a.foundersName}</strong>
              <br />
              {a.foundersRole}
            </p>
            {paragraphs(a.foundersBody).map((p, i) => (
              <p key={i} className="about-body">
                {withBreaks(p)}
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* 10. Shop the collection */}
      {live.length > 0 && (
        <section className="page about-shop">
          <h2 className="about-h2">{a.shopHeading}</h2>
          <div className="grid grid--3">
            {live.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      <p className="page about-back">
        <Link to="/">← Back to the store</Link>
      </p>
    </div>
  );
}
