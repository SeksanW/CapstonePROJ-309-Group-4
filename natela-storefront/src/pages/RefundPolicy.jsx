import { Link } from "react-router-dom";
import { CONTACT_EMAIL } from "./Contact";

/* /refund-policy — the returns policy, linked from the footer. Same text
   as natelafitwear.com's refund policy. The help chat's prompt has a
   summary of it too (backend: services/support-service/src/claude.js),
   so update that if the policy changes. */

export default function RefundPolicy() {
  return (
    <div className="page guide policy">
      <span className="eyebrow">Refund policy</span>
      <h1 className="about-h1">Returns policy</h1>
      <p className="about-body policy__note">
        Our return policy is updated regularly to reflect real time items that will be added to our catalog in the near
        future.
      </p>
      <p className="about-body">
        We get it, not everything works out and you want to return or exchange. As long as your item(s) were purchased
        from natelafitwear.com, and are still in their original condition, you have <strong>up to 30 days</strong> to
        return your item to us!
      </p>

      <h2 className="about-h2">What items can I return?</h2>
      <p className="about-body">
        Any unwanted product must be returned within 30 days from when your Natela Fit Wear order was delivered (if the
        order was placed online).
      </p>

      <h2 className="about-h2">Product condition requirements</h2>
      <ul className="policy__list">
        <li>Items can be returned even if the swing tag has been removed, as long as the item is unworn and unwashed.</li>
        <li>
          <strong>If the small white care wash label has been cut out, the return cannot be accepted.</strong>
        </li>
        <li>
          To receive a full refund on eligible returns, all items must be returned to us unworn, unused, unwashed and in
          the same condition you received them. If an item is returned to us damaged, worn, or in an unsuitable
          condition, we won't be able to give you a refund.
        </li>
        <li>
          All items are inspected on return. Items do not need to be returned in their original packaging, but they
          should be securely packed to avoid damage during transit.
        </li>
      </ul>

      <div className="policy__help">
        <strong>Need to start a return?</strong> Email us at{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> with your order number, or ask the help chat in the
        corner. More ways to reach us on the <Link to="/contact">contact page</Link>.
      </div>
    </div>
  );
}
