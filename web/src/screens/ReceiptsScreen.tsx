import type { ScreenProps } from '../App';
import ItemsListScreen from '../components/ItemsListScreen';
export default function ReceiptsScreen(_p: ScreenProps) {
  return (
    <ItemsListScreen
      kind="receipt"
      title="Receipts"
      eyebrow="SCAN · CATEGORISE · TAXES"
      icon="mail"
      hue={60}
      addPlaceholder="Add a receipt"
      emptyHint="Save for tax season."
      
    />
  );
}
