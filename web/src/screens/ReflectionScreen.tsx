import type { ScreenProps } from '../App';
import ItemsListScreen from '../components/ItemsListScreen';
export default function ReflectionScreen(_p: ScreenProps) {
  return (
    <ItemsListScreen
      kind="reflection"
      title="Reflection"
      eyebrow="WEEKLY · MONTHLY · YEARLY"
      icon="sparkle"
      hue={200}
      addPlaceholder="Write a reflection"
      emptyHint="Slow down and notice."
      
    />
  );
}
