import type { ScreenProps } from '../App';
import ItemsListScreen from '../components/ItemsListScreen';
export default function LanguagesScreen(_p: ScreenProps) {
  return (
    <ItemsListScreen
      kind="language_deck"
      title="Languages"
      eyebrow="DECKS · STREAKS · LISTEN"
      icon="globe"
      hue={60}
      addPlaceholder="Add a deck or word"
      emptyHint="Build your fluency."
      
    />
  );
}
