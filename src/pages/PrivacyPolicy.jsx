import React from "react";

const PrivacyPolicy = () => (
  <div className="max-w-2xl mx-auto p-6">
    <h1 className="text-2xl font-bold mb-4">Privacy Policy – FarmEazy</h1>
    <p>FarmEazy values your privacy and is committed to protecting your personal information.</p>
    <h2 className="mt-6 text-lg font-semibold">Information We Collect</h2>
    <ul className="list-disc ml-6">
      <li>Name, email address, phone number</li>
      <li>Delivery address</li>
      <li>Payment information processed via Razorpay</li>
      <li>Usage data for improving platform performance</li>
    </ul>
    <h2 className="mt-6 text-lg font-semibold">How We Use the Information</h2>
    <ul className="list-disc ml-6">
      <li>To process orders and payments</li>
      <li>To communicate order updates</li>
      <li>To improve the FarmEazy platform</li>
      <li>To provide customer support</li>
    </ul>
    <h2 className="mt-6 text-lg font-semibold">Third-Party Services</h2>
    <p>Payments are securely processed through Razorpay. FarmEazy does not store full payment card details.</p>
    <h2 className="mt-6 text-lg font-semibold">Data Security</h2>
    <p>We implement appropriate security measures to protect your data from unauthorized access.</p>
    <h2 className="mt-6 text-lg font-semibold">Contact</h2>
    <p>For privacy concerns please contact <a href="mailto:support@farm-eazy.com" className="text-blue-600 underline">support@farm-eazy.com</a></p>
  </div>
);

export default PrivacyPolicy;
