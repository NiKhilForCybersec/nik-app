import type { ScreenProps } from '../App';
import ItemsListScreen from '../components/ItemsListScreen';
export default function LearningScreen(_p: ScreenProps) {
  return (
    <ItemsListScreen
      kind="learning"
      title="Learning"
      eyebrow="COURSES · STREAKS · GOALS"
      icon="brain"
      hue={220}
      addPlaceholder="Add a course or topic"
      emptyHint="What are you learning right now?"
      
    />
  );
}
