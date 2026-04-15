import React from 'react'
import { PublicLegalPage } from '../components/public/PublicPagePrimitives'

const Terms = () => (
  <PublicLegalPage
    title="Terms and Conditions - FarmEazy"
    description="FarmEazy is an online marketplace connecting farmers, service providers, and customers."
    noteTitle="The legal terms remain unchanged"
    noteText="Only page presentation is upgraded to improve reading comfort across device sizes and modes."
    sections={[
      { title: 'User Responsibilities', body: 'Users must provide accurate information and use the platform only for lawful purposes.' },
      { title: 'Vendor Responsibility', body: 'Vendors are responsible for the quality, pricing, and delivery of their listed products or services.' },
      { title: 'Payments', body: 'Payments are securely processed via Razorpay.' },
      { title: 'Limitation of Liability', body: 'FarmEazy acts as a platform facilitator and is not directly responsible for vendor products.' },
      { title: 'Account Termination', body: 'FarmEazy reserves the right to suspend accounts violating platform rules.' },
    ]}
  />
);

export default Terms;
