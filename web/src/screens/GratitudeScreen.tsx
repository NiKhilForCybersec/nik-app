import type { ScreenProps } from '../App';
import ItemsListScreen from '../components/ItemsListScreen';
export default function GratitudeScreen(_p: ScreenProps) {
  return (
    <ItemsListScreen
      kind="gratitude"
      title="Gratitude"
      eyebrow="DAILY · 3 THINGS"
      icon="heart"
      hue={320}
      addPlaceholder="One thing you're grateful for"
      emptyHint="Three things, every day."
      
    />
  );
}
