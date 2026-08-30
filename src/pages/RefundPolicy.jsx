import React from 'react'
import { PublicLegalPage } from '../components/public/PublicPagePrimitives'

const RefundPolicy = () => (
  <PublicLegalPage
    title="Refund and Cancellation Policy - FarmEazy"
    description="Orders can be cancelled before the vendor confirms the order."
    noteTitle="Approved refunds are returned in 5-7 business days"
    noteText="Policy wording is unchanged; this layout prioritizes clarity and scanability."
    sections={[
      { title: 'Order Cancellation', body: 'Orders can be cancelled before the vendor confirms the order.' },
      {
        title: 'Refund Eligibility',
        body: (
          <ul className="list-disc ml-6 space-y-1">
            <li>Order cancellation</li>
            <li>Product not delivered</li>
            <li>Damaged or incorrect items</li>
          </ul>
        ),
      },
      { title: 'Refund Processing', body: 'Approved refunds will be processed within 5-7 business days through the original payment method.' },
      { title: 'Vendor Policies', body: 'Certain vendors may have specific refund policies which will be displayed on their listings.' },
    ]}
  />
);

export default RefundPolicy;
