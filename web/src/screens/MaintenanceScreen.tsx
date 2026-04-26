import type { ScreenProps } from '../App';
import ItemsListScreen from '../components/ItemsListScreen';
export default function MaintenanceScreen(_p: ScreenProps) {
  return (
    <ItemsListScreen
      kind="home_maintenance"
      title="Home"
      eyebrow="FILTERS · SERVICE · WARRANTY"
      icon="settings"
      hue={220}
      addPlaceholder="Add a task"
      emptyHint="Maintain your space."
      
    />
  );
}
