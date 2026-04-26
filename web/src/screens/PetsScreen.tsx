import type { ScreenProps } from '../App';
import ItemsListScreen from '../components/ItemsListScreen';
export default function PetsScreen(_p: ScreenProps) {
  return (
    <ItemsListScreen
      kind="pet"
      title="Pets"
      eyebrow="VET · MEDS · FEEDING"
      icon="heart"
      hue={60}
      addPlaceholder="Add a pet"
      emptyHint="Track your animals."
      
    />
  );
}
