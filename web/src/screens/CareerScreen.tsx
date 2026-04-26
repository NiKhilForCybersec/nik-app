import type { ScreenProps } from '../App';
import ItemsListScreen from '../components/ItemsListScreen';
export default function CareerScreen(_p: ScreenProps) {
  return (
    <ItemsListScreen
      kind="career_note"
      title="Career"
      eyebrow="GOALS · REVIEW · NEXT ROLE"
      icon="trend"
      hue={150}
      addPlaceholder="Add a career note"
      emptyHint="Track your trajectory."
      
    />
  );
}
