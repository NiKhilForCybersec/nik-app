import type { ScreenProps } from '../App';
import ItemsListScreen from '../components/ItemsListScreen';
export default function WardrobeScreen(_p: ScreenProps) {
  return (
    <ItemsListScreen
      kind="wardrobe"
      title="Wardrobe"
      eyebrow="OUTFITS · CAPSULE · LAUNDRY"
      icon="shopping"
      hue={320}
      addPlaceholder="Add an outfit"
      emptyHint="Curate your style."
      
    />
  );
}
