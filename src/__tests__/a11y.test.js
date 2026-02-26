import React from 'react';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import DashboardEnhanced from '../pages/DashboardEnhanced';

expect.extend(toHaveNoViolations);

describe('Accessibility checks', () => {
  it('DashboardEnhanced should have no a11y violations', async () => {
    const { container } = render(<DashboardEnhanced />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
