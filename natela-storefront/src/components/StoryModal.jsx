import BubblePopup from "./BubblePopup";

/* The "Our story" popup's content — see BubblePopup for how it's shown. */

const STACKS = [
  {
    heading: "Serving to unleash the everyday warrior in you",
    images: ["/images/story/story-01.jpg"],
    body: `We, Natalia & Elissa are not building a community - we are part of one. As women who fell in love with the sport, we love everything Muay Thai represents - the strength, discipline, confidence, resilience and community. But when it came to fighter apparel, something was missing.`,
    imageLayout: "side",
  },
  {
    heading: "360 WARRIOR",
    images: ["/images/story/story-02.jpg", "/images/story/story-03.jpg"],
    body: `We wanted shorts that celebrated and nurtured both sides of us: strong and feminine, powerful and artistic, graceful and fierce. We wanted apparel that acknowledges everyday internal and external battles we face.`,
  },
  {
    heading: "We serve to unleash the everyday warrior in you!",
    images: ["/images/story/story-04.jpg", "/images/story/story-05.jpg", "/images/story/story-06.jpg"],
    body: `Our vision became a women's Muay Thai brand built around thoughtful fits, beautiful materials, and original artwork. Instead of treating shorts as just another piece of training gear, we wanted each design to feel like wearable art and a badge of honour - inside and outside the ring!`,
  },
  { heading: "We serve to unleash the everyday warrior in you!", closing: true },
];

export default function StoryModal({ onClose, onStore }) {
  return <BubblePopup stacks={STACKS} label="Our story" onClose={onClose} onStore={onStore} />;
}
