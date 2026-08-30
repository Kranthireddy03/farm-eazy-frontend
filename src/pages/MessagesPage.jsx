import { useParams } from 'react-router-dom';
import VendorUserChat from '../components/marketplace/VendorUserChat';

export default function MessagesPage() {
  const { displayId } = useParams();
  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      <h1 className="text-xl font-semibold">Messages</h1>
      <VendorUserChat displayId={displayId} participantName="Private vendor conversation" />
    </div>
  );
}
