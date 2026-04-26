import type { ScreenProps } from '../App';
import ItemsListScreen from '../components/ItemsListScreen';
export default function TimecapsuleScreen(_p: ScreenProps) {
  return (
    <ItemsListScreen
      kind="time_capsule"
      title="Time Capsule"
      eyebrow="LETTERS · SEALED · OPEN IN N"
      icon="clock"
      hue={150}
      addPlaceholder="Write a letter"
      emptyHint="Notes to your future self."
      withDate
    />
  );
}
