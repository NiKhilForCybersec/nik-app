import type { ScreenProps } from '../App';
import ItemsListScreen from '../components/ItemsListScreen';
export default function GoalsScreen(_p: ScreenProps) {
  return (
    <ItemsListScreen
      kind="goal"
      title="Goals"
      eyebrow="YEAR · QUARTER · WEEK"
      icon="target"
      hue={150}
      addPlaceholder="A goal to track"
      emptyHint="Where are you headed?"
      
    />
  );
}
