/* Women's shorts size guide: just the chart picture, same as
   natelafitwear.com/pages/womens-shorts-sizing-chart. The numbers in it
   are also written into the help chat's prompt
   (backend: services/support-service/src/claude.js) so the assistant can
   recommend sizes — update both if the chart changes. */

export default function SizeGuide() {
  return (
    <div className="page guide">
      <figure className="guide-figure guide-figure--center">
        <img
          src="/images/guides/size-chart.jpg"
          alt="Natela women's shorts size chart. S: 50–54 kg, waist 63–67.5 cm (25–27 in), hips 96.5–101.5 cm (38–40 in). M: 54–59 kg, waist 67.5–71 cm (26.5–28 in), hips 101.5–106.5 cm (40–42 in). L: 59–64 kg, waist 71–75 cm (28–29.5 in), hips 106.5–112 cm (42–44 in). XL: 64–70 kg, waist 75–78.5 cm (29.5–31 in), hips 112–117 cm (44–46 in). Sizes are approximate and generous: if between sizes, size down if taller with narrower hips, size up if shorter and heavier-set."
        />
      </figure>
    </div>
  );
}
