import React from 'react'
import { PublicLegalPage } from '../components/public/PublicPagePrimitives'

const MarketplaceDisclosure = () => (
  <PublicLegalPage
    title="Marketplace Disclosure - FarmEazy"
    description="FarmEazy operates as a digital marketplace connecting customers with farmers and agricultural service providers."
    noteTitle="Vendor identity is visible before purchase"
    noteText="Disclosure wording is preserved while visual readability is improved across both modes."
    sections={[
      { title: 'Marketplace Role', body: 'FarmEazy operates as a digital marketplace connecting customers with farmers and agricultural service providers.' },
      { title: 'Vendor Responsibility', body: 'Vendors on FarmEazy are independent sellers responsible for their products and services.' },
      {
        title: 'Visible Vendor Details',
        body: (
          <ul className="list-disc ml-6 space-y-1">
            <li>Vendor Name</li>
            <li>Vendor ID</li>
            <li>Vendor Location</li>
            <li>Vendor Type (Farmer / Service Provider)</li>
          </ul>
        ),
      },
      { title: 'Payments', body: 'Payments are securely processed via Razorpay.' },
    ]}
  />
);

export default MarketplaceDisclosure;
