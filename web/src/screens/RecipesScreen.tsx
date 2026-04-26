import type { ScreenProps } from '../App';
import ItemsListScreen from '../components/ItemsListScreen';
export default function RecipesScreen(_p: ScreenProps) {
  return (
    <ItemsListScreen
      kind="recipe"
      title="Recipes"
      eyebrow="SAVE · COOK · PLAN WEEK"
      icon="utensils"
      hue={30}
      addPlaceholder="Add a recipe"
      emptyHint="Build your cookbook."
      
    />
  );
}
