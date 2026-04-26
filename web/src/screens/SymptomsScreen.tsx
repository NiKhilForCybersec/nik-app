import type { ScreenProps } from '../App';
import ItemsListScreen from '../components/ItemsListScreen';
export default function SymptomsScreen(_p: ScreenProps) {
  return (
    <ItemsListScreen
      kind="symptoms"
      title="Symptoms"
      eyebrow="LOG · PATTERNS · AI"
      icon="alert"
      hue={25}
      addPlaceholder="Describe a symptom"
      emptyHint="Log when something feels off."
      
    />
  );
}
