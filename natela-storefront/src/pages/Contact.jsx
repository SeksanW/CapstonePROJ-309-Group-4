import { Link } from "react-router-dom";

/* /contact — the shop's contact information, linked from the footer. */

export const CONTACT_EMAIL = "hello@natelafitwear.com";

export default function Contact() {
  return (
    <div className="page guide policy">
      <span className="eyebrow">Contact</span>
      <h1 className="about-h1">Contact information</h1>

      <dl className="policy__facts">
        <dt>Merchant name</dt>
        <dd>Natela Fit Wear</dd>
        <dt>Customer support</dt>
        <dd>
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        </dd>
      </dl>

      <p className="about-body">
        For sizing, orders and returns you can also use the help chat in the bottom-right corner. Thinking of sending
        something back? Read our <Link to="/refund-policy">refund policy</Link> first.
      </p>
    </div>
  );
}
