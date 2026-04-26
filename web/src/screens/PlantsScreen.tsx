import type { ScreenProps } from '../App';
import ItemsListScreen from '../components/ItemsListScreen';
export default function PlantsScreen(_p: ScreenProps) {
  return (
    <ItemsListScreen
      kind="plant"
      title="Plants"
      eyebrow="WATER · SUN · HEALTH"
      icon="flame"
      hue={150}
      addPlaceholder="Add a plant"
      emptyHint="Keep them alive."
      
    />
  );
}
