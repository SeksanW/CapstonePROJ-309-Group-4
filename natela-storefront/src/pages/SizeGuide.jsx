/* Women's shorts size guide — same content as
   natelafitwear.com/pages/womens-shorts-sizing-chart. The chart there is
   only an image, so it's also written out here as a real table (readable
   by screen readers and on small phones). Keep the two in sync if the
   sizes change. */

const SIZES = [
  { size: "S", kg: "50 – 54", waistCm: "63 – 67.5", waistIn: "25 – 27", hipsCm: "96.5 – 101.5", hipsIn: "38 – 40" },
  { size: "M", kg: "54 – 59", waistCm: "67.5 – 71", waistIn: "26.5 – 28", hipsCm: "101.5 – 106.5", hipsIn: "40 – 42" },
  { size: "L", kg: "59 – 64", waistCm: "71 – 75", waistIn: "28 – 29.5", hipsCm: "106.5 – 112", hipsIn: "42 – 44" },
  { size: "XL", kg: "64 – 70", waistCm: "75 – 78.5", waistIn: "29.5 – 31", hipsCm: "112 – 117", hipsIn: "44 – 46" },
];

export default function SizeGuide() {
  return (
    <div className="page guide">
      <h1 className="about-h1">Women's Shorts Size Chart</h1>
      <p className="about-body">
        Size ranges are approximate. Our shorts are cut to allow for movement and fit generously. If you're
        between sizes: size down if you're taller with narrower hips, or size up if you're shorter and
        heavier-set for more give.
      </p>

      <div className="table-wrap guide-table">
        <table>
          <thead>
            <tr>
              <th rowSpan={2}>Size</th>
              <th>Weight</th>
              <th colSpan={2}>Waist</th>
              <th colSpan={2}>Hips</th>
            </tr>
            <tr>
              <th>kg</th>
              <th>cm</th>
              <th>inch</th>
              <th>cm</th>
              <th>inch</th>
            </tr>
          </thead>
          <tbody>
            {SIZES.map((s) => (
              <tr key={s.size}>
                <td><strong>{s.size}</strong></td>
                <td>{s.kg}</td>
                <td>{s.waistCm}</td>
                <td>{s.waistIn}</td>
                <td>{s.hipsCm}</td>
                <td>{s.hipsIn}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <figure className="guide-figure">
        <img
          src="/images/guides/size-chart.jpg"
          alt="Natela women's shorts size chart, showing where to measure the waist (across the waistband) and hips (across the widest part of the shorts)."
        />
      </figure>
    </div>
  );
}
