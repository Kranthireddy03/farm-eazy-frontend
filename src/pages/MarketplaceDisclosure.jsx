import React from "react";

const MarketplaceDisclosure = () => (
  <div className="max-w-2xl mx-auto p-6">
    <h1 className="text-2xl font-bold mb-4">Marketplace Disclosure – FarmEazy</h1>
    <p>FarmEazy operates as a digital marketplace connecting customers with farmers and agricultural service providers.</p>
    <p className="mt-4">Vendors on FarmEazy are independent sellers responsible for their products and services.</p>
    <p className="mt-4">Before completing a purchase, customers will be able to view vendor details including:</p>
    <ul className="list-disc ml-6">
      <li>Vendor Name</li>
      <li>Vendor ID</li>
      <li>Vendor Location</li>
      <li>Vendor Type (Farmer / Service Provider)</li>
    </ul>
    <p className="mt-4">Payments are securely processed via Razorpay.</p>
  </div>
);

export default MarketplaceDisclosure;
