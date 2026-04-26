import type { ScreenProps } from '../App';
import ItemsListScreen from '../components/ItemsListScreen';

export default function ReadingScreen(_p: ScreenProps) {
  return (
    <ItemsListScreen
      kind="reading"
      title="Reading"
      eyebrow="BOOKS · ARTICLES · PAPERS"
      icon="book"
      hue={280}
      addPlaceholder="Add a book or article…"
      emptyHint="Add the next book on your list."
      renderMeta={(item) => {
        const author = (item.meta as { author?: string }).author;
        return author ? <span>by {author}</span> : null;
      }}
    />
  );
}
