import type { ScreenProps } from '../App';
import ItemsListScreen from '../components/ItemsListScreen';
export default function AchievementsScreen(_p: ScreenProps) {
  return (
    <ItemsListScreen
      kind="achievement"
      title="Achievements"
      eyebrow="BADGES · STREAKS · LEVEL"
      icon="sparkles"
      hue={60}
      addPlaceholder="Add an achievement"
      emptyHint="Celebrate your wins."
      
    />
  );
}
