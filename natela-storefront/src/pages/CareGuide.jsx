import { usePageSection } from "../context/PageContentContext";

/* How to wash & care for your shorts — same steps as
   natelafitwear.com/pages/how-to-wash-care-for-your-shorts.

   Every text and photo is editable in the admin's "Main page edits" →
   Care guide (page content `care`). Each step's instructions are one per
   line. Empty fields use these built-in defaults — keep them in sync with
   the admin's DEFAULTS. */

export const CARE_DEFAULTS = {
  heading: "How to Wash & Care for Your Shorts",
  intro:
    "#EverydayWarriors — a little care keeps your Muay Thai shorts performing round after round. Don't leave sweaty shorts balled up in your gym bag: trapped moisture breeds odour-causing bacteria and wears out the elastic. Empty the side pockets and loosely tie the drawstrings so they don't snag in the wash.",
  step1Title: "Pre-wash prep",
  step1Image: "/images/guides/care-prep.jpg",
  step1Items: [
    "Check for loose threads, damaged stitching or trapped debris, and fix or remove anything that could get worse in the wash.",
    "Empty the side pockets — tape, cards, coins and other small items.",
    "Fasten any hook-and-loop closures, drawcords or snaps.",
    "Turn the shorts inside out to protect the print, embroidery, trims and outer finish.",
    "Sort darks, brights and lights, and wash similar colours together.",
    "Read the care label and follow it when choosing your wash settings.",
  ].join("\n"),
  step2Title: "Washing cycle",
  step2Image: "/images/guides/care-wash.jpg",
  step2Items: [
    "Use a cold, gentle or delicate cycle — cold water is the safest choice.",
    "Use a mild detergent, measured as the detergent's instructions say.",
    "Don't overload the machine, so water and detergent can move freely.",
    "Skip bleach, fabric softener and harsh stain removers; they can damage colours, finishes, elastic, prints and trims.",
  ].join("\n"),
  step3Title: "Air dry only",
  step3Image: "/images/guides/care-dry.jpg",
  step3Items: [
    "Take the shorts out as soon as the cycle ends and gently reshape them while damp.",
    "Dry them flat or hanging, somewhere shaded and well ventilated.",
    "Keep them away from direct sun, radiators and other strong heat.",
    "Don't tumble dry unless the care label says you can.",
  ].join("\n"),
  heatHeading: "Why avoid heat?",
  heatBody:
    "High heat can damage synthetic and satin-like fabrics, elastic, prints, embroidery and trims. Wash cool, dry in the air, and your shorts will stay ready for every round.",
};

const lines = (text) => text.split("\n").map((l) => l.trim()).filter(Boolean);

/* The care steps. Shown on the "Size chart & product care" page
   (Guides.jsx, /care-guide) and in the product page's popup
   (SizeCareModal). */
export function CareContent() {
  const c = usePageSection("care", CARE_DEFAULTS);
  const steps = [1, 2, 3]
    .map((n) => ({
      num: String(n).padStart(2, "0"),
      title: c[`step${n}Title`],
      image: c[`step${n}Image`],
      items: lines(c[`step${n}Items`]),
    }))
    .filter((s) => s.title || s.items.length);

  return (
    <>
      <h1 className="about-h1">{c.heading}</h1>
      <p className="about-body">{c.intro}</p>

      {steps.map((step) => (
        <section key={step.num} className="guide-step">
          {step.image && <img src={step.image} alt="" className="guide-step__img" />}
          <div>
            <h2 className="about-h2">
              <span className="guide-step__num">{step.num}</span> {step.title}
            </h2>
            <ol className="guide-step__list">
              {step.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
          </div>
        </section>
      ))}

      <section className="guide-note">
        <h2 className="about-h2">{c.heatHeading}</h2>
        <p className="about-body">{c.heatBody}</p>
      </section>
    </>
  );
}
