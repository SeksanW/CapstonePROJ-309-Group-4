import BubblePopup from "./BubblePopup";

/* The "Design" popup's content — see BubblePopup for how it's shown. Ends
   on the same closing bubble as "Our story" for consistency. */

const STACKS = [
  {
    heading: "The Inspiration",
    images: ["/images/design/design-01.jpg"],
    body: `Koi fishes are meant to look authentic with our watercolour/acrylic brush marks. We chose vibrant, juicy colours to highlight and bring out the inner warrior strength inside all of us.`,
    imageLayout: "side",
  },
  {
    heading: "The Water Color",
    images: ["/images/design/design-02.jpg"],
    body: `A unique watercolour Koi Fish design created specifically for women's Muay Thai shorts, featuring fluid brushwork, soft yet vibrant colour transitions, and organic details. Each Koi fish has the character of a hand-painted watercolour piece, giving the shorts an artistic, one-of-a-kind look rather than a traditional graphic-print appearance.`,
    imageLayout: "side",
  },
  {
    heading: "Made by Us for You",
    images: ["/images/design/design-03.jpg"],
    body: `You are the true Hero fighting your own mind. Our brand provides the tools, map, and encouragement to help you defeat those thoughts. When you wear our products, you are transformed and feel like the everyday warrior you are.`,
    imageLayout: "side",
  },
  { heading: "We serve to unleash the everyday warrior in you!", closing: true },
];

export default function DesignModal({ onClose, onStore }) {
  return <BubblePopup stacks={STACKS} label="Design" onClose={onClose} onStore={onStore} />;
}
