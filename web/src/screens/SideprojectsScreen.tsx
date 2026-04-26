import type { ScreenProps } from '../App';
import ItemsListScreen from '../components/ItemsListScreen';
export default function SideprojectsScreen(_p: ScreenProps) {
  return (
    <ItemsListScreen
      kind="side_project"
      title="Side Projects"
      eyebrow="REPOS · IDEAS · CADENCE"
      icon="sparkle"
      hue={25}
      addPlaceholder="Add a side project"
      emptyHint="Your evening hustle."
      
    />
  );
}
