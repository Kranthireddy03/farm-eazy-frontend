import apiClient from '../../services/apiClient';
import LocationPicker from '../LocationPicker';
import { DetailPanel } from '../platform/DetailPanel';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

export function CheckoutAddressSection({
  addresses,
  selectedAddress,
  onSelectAddress,
  showAddressForm,
  onToggleAddressForm,
  onAddressAdded,
  showToast,
}) {
  return (
    <DetailPanel title="Delivery address" description="Select a saved address or add a new one.">
      {addresses.length > 0 && !showAddressForm && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Saved addresses</p>
          {addresses.map((addr) => {
            const selected = selectedAddress === addr.id;
            return (
              <label
                key={addr.id}
                className={cn(
                  'flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors',
                  selected
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-muted-foreground/40',
                )}
              >
                <input
                  type="radio"
                  name="address"
                  value={addr.id}
                  checked={selected}
                  onChange={(e) => onSelectAddress(Number(e.target.value))}
                  className="mt-1 h-4 w-4 accent-primary"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-foreground">{addr.fullName}</span>
                    {addr.addressType && (
                      <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
                        {addr.addressType}
                      </span>
                    )}
                  </div>
                  <p className="text-sm mt-1 text-foreground">{addr.addressLine1}</p>
                  {addr.addressLine2 && (
                    <p className="text-sm text-muted-foreground">{addr.addressLine2}</p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    {addr.city}, {addr.state} — {addr.postalCode}
                  </p>
                  <p className="text-sm mt-1 text-muted-foreground">{addr.phoneNumber}</p>
                </div>
              </label>
            );
          })}
        </div>
      )}

      <Button
        type="button"
        variant={showAddressForm ? 'destructive' : 'default'}
        className="w-full"
        onClick={onToggleAddressForm}
      >
        {showAddressForm ? 'Cancel' : 'Add address'}
      </Button>

      {showAddressForm && (
        <div className="mt-4 rounded-lg border border-border overflow-hidden">
          <LocationPicker
            onAddressSubmit={async (addressData) => {
              try {
                const response = await apiClient.post('/addresses', addressData);
                showToast('Address saved', 'success');
                onAddressAdded(response.data?.id);
              } catch (error) {
                showToast(
                  `Failed to save address: ${error.response?.data?.message || error.message}`,
                  'error',
                );
              }
            }}
          />
        </div>
      )}
    </DetailPanel>
  );
}
