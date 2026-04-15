import React from 'react'
import { PublicLegalPage } from '../components/public/PublicPagePrimitives'

const PrivacyPolicy = () => (
  <PublicLegalPage
    title="Privacy Policy - FarmEazy"
    description="FarmEazy values your privacy and is committed to protecting your personal information."
    noteTitle="This page is informational only"
    noteText="Policy wording remains unchanged; presentation is upgraded for clearer readability across themes."
    sections={[
      {
        title: 'Information We Collect',
        body: (
          <ul className="list-disc ml-6 space-y-1">
            <li>Name, email address, phone number</li>
            <li>Delivery address</li>
            <li>Payment information processed via Razorpay</li>
            <li>Usage data for improving platform performance</li>
          </ul>
        ),
      },
      {
        title: 'How We Use the Information',
        body: (
          <ul className="list-disc ml-6 space-y-1">
            <li>To process orders and payments</li>
            <li>To communicate order updates</li>
            <li>To improve the FarmEazy platform</li>
            <li>To provide customer support</li>
          </ul>
        ),
      },
      {
        title: 'Third-Party Services',
        body: <p>Payments are securely processed through Razorpay. FarmEazy does not store full payment card details.</p>,
      },
      {
        title: 'Data Security',
        body: <p>We implement appropriate security measures to protect your data from unauthorized access.</p>,
      },
      {
        title: 'Contact',
        body: <p>For privacy concerns please contact <a href="mailto:support@farm-eazy.com" className="text-cyan-700 dark:text-cyan-300 underline">support@farm-eazy.com</a></p>,
      },
    ]}
  />
);

export default PrivacyPolicy;
