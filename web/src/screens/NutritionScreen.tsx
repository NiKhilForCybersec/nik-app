import type { ScreenProps } from '../App';
import ItemsListScreen from '../components/ItemsListScreen';
export default function NutritionScreen(_p: ScreenProps) {
  return (
    <ItemsListScreen
      kind="nutrition"
      title="Nutrition"
      eyebrow="MACROS · MEALS · DEFICIT"
      icon="utensils"
      hue={60}
      addPlaceholder="Add a meal or food"
      emptyHint="Track what you eat — macros catch up later."
      
    />
  );
}
