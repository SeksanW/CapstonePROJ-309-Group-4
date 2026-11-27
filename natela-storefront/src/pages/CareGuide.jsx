/* How to wash & care for your shorts — same steps as
   natelafitwear.com/pages/how-to-wash-care-for-your-shorts. */

const STEPS = [
  {
    num: "01",
    title: "Pre-wash prep",
    image: "/images/guides/care-prep.jpg",
    items: [
      "Check for loose threads, damaged stitching or trapped debris, and fix or remove anything that could get worse in the wash.",
      "Empty the side pockets — tape, cards, coins and other small items.",
      "Fasten any hook-and-loop closures, drawcords or snaps.",
      "Turn the shorts inside out to protect the print, embroidery, trims and outer finish.",
      "Sort darks, brights and lights, and wash similar colours together.",
      "Read the care label and follow it when choosing your wash settings.",
    ],
  },
  {
    num: "02",
    title: "Washing cycle",
    image: "/images/guides/care-wash.jpg",
    items: [
      "Use a cold, gentle or delicate cycle — cold water is the safest choice.",
      "Use a mild detergent, measured as the detergent's instructions say.",
      "Don't overload the machine, so water and detergent can move freely.",
      "Skip bleach, fabric softener and harsh stain removers; they can damage colours, finishes, elastic, prints and trims.",
    ],
  },
  {
    num: "03",
    title: "Air dry only",
    image: "/images/guides/care-dry.jpg",
    items: [
      "Take the shorts out as soon as the cycle ends and gently reshape them while damp.",
      "Dry them flat or hanging, somewhere shaded and well ventilated.",
      "Keep them away from direct sun, radiators and other strong heat.",
      "Don't tumble dry unless the care label says you can.",
    ],
  },
];

export default function CareGuide() {
  return (
    <div className="page guide">
      <h1 className="about-h1">How to Wash &amp; Care for Your Shorts</h1>
      <p className="about-body">
        #EverydayWarriors — a little care keeps your Muay Thai shorts performing round after round. Don't leave
        sweaty shorts balled up in your gym bag: trapped moisture breeds odour-causing bacteria and wears out the
        elastic. Empty the side pockets and loosely tie the drawstrings so they don't snag in the wash.
      </p>

      {STEPS.map((step) => (
        <section key={step.num} className="guide-step">
          <img src={step.image} alt="" className="guide-step__img" />
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
        <h2 className="about-h2">Why avoid heat?</h2>
        <p className="about-body">
          High heat can damage synthetic and satin-like fabrics, elastic, prints, embroidery and trims. Wash cool,
          dry in the air, and your shorts will stay ready for every round.
        </p>
      </section>
    </div>
  );
}
