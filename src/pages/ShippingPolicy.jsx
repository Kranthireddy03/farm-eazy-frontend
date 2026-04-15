import React from 'react'
import { PublicLegalPage } from '../components/public/PublicPagePrimitives'

const ShippingPolicy = () => (
  <PublicLegalPage
    title="Shipping Policy - FarmEazy"
    description="Shipping coverage depends on vendor availability and delivery region."
    noteTitle="Typical delivery takes 3-5 business days"
    noteText="Policy text is preserved; layout is improved for desktop and mobile readability."
    sections={[
      { title: 'Delivery Coverage', body: 'FarmEazy delivers products to selected regions based on vendor availability.' },
      { title: 'Delivery Timeline', body: 'Orders are typically delivered within 3-5 business days depending on vendor location.' },
      { title: 'Shipping Charges', body: 'Shipping fees may vary depending on the product and delivery location.' },
      { title: 'Delivery Responsibility', body: 'Vendors are responsible for dispatching the products within the specified time.' },
    ]}
  />
);

export default ShippingPolicy;
