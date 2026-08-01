import { CheckoutStepIndicator } from './CheckoutStepIndicator';
import { BrandLoader } from '../ui/brand-loader';
import { Card, CardContent } from '../ui/card';

/**
 * Full-screen checkout processing state — payment → order → complete.
 */
export function CheckoutProcessingOverlay({ message, step, totalSteps = 3 }) {
  const steps = ['Payment', 'Order', 'Complete'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardContent className="pt-8 pb-8 text-center space-y-6">
          <BrandLoader message={message || 'Processing your order…'} />
          <CheckoutStepIndicator steps={steps} currentStep={step} totalSteps={totalSteps} />
          <p className="text-xs text-muted-foreground">
            Please do not close or refresh this page.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
