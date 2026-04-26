import type { ScreenProps } from '../App';
import ItemsListScreen from '../components/ItemsListScreen';
export default function PhotosScreen(_p: ScreenProps) {
  return (
    <ItemsListScreen
      kind="photo"
      title="Photos"
      eyebrow="ROLL · FAVOURITES · TIMELINE"
      icon="camera"
      hue={30}
      addPlaceholder="Add a photo URL"
      emptyHint="Capture moments."
      
    />
  );
}
