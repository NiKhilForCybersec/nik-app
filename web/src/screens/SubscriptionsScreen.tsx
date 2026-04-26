import type { ScreenProps } from '../App';
import ItemsListScreen from '../components/ItemsListScreen';
export default function SubscriptionsScreen(_p: ScreenProps) {
  return (
    <ItemsListScreen
      kind="subscription"
      title="Subscriptions"
      eyebrow="AUDIT · CANCEL · SAVE"
      icon="refresh"
      hue={200}
      addPlaceholder="Add a subscription"
      emptyHint="Audit your monthly burn."
      
    />
  );
}
