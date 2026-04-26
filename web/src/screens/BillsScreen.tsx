import type { ScreenProps } from '../App';
import ItemsListScreen from '../components/ItemsListScreen';
export default function BillsScreen(_p: ScreenProps) {
  return (
    <ItemsListScreen
      kind="bill"
      title="Bills"
      eyebrow="RECURRING · AUTO · ALERTS"
      icon="mail"
      hue={25}
      addPlaceholder="Add a bill"
      emptyHint="Stay on top of payments."
      withDate
    />
  );
}
