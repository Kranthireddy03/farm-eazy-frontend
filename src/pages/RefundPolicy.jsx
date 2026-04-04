import React from "react";

const RefundPolicy = () => (
  <div className="max-w-2xl mx-auto p-6">
    <h1 className="text-2xl font-bold mb-4">Refund & Cancellation Policy – FarmEazy</h1>
    <h2 className="mt-6 text-lg font-semibold">Order Cancellation</h2>
    <p>Orders can be cancelled before the vendor confirms the order.</p>
    <h2 className="mt-6 text-lg font-semibold">Refund Eligibility</h2>
    <ul className="list-disc ml-6">
      <li>Order cancellation</li>
      <li>Product not delivered</li>
      <li>Damaged or incorrect items</li>
    </ul>
    <h2 className="mt-6 text-lg font-semibold">Refund Processing</h2>
    <p>Approved refunds will be processed within 5–7 business days through the original payment method.</p>
    <h2 className="mt-6 text-lg font-semibold">Vendor Policies</h2>
    <p>Certain vendors may have specific refund policies which will be displayed on their listings.</p>
  </div>
);

export default RefundPolicy;
