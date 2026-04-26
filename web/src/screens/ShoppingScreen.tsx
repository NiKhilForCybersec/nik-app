import type { ScreenProps } from '../App';
import ItemsListScreen from '../components/ItemsListScreen';

export default function ShoppingScreen(_p: ScreenProps) {
  return (
    <ItemsListScreen
      kind="shopping"
      title="Shopping"
      eyebrow="GROCERIES · ERRANDS · STUFF"
      icon="shopping"
      hue={200}
      addPlaceholder="Add an item to buy…"
      emptyHint="Nothing on the list — add what you need."
      renderMeta={(item) => {
        const qty = (item.meta as { quantity?: number | string }).quantity;
        const store = (item.meta as { store?: string }).store;
        return [
          qty ? <span key="q">{`× ${qty}`}</span> : null,
          store ? <span key="s">@ {store}</span> : null,
        ].filter(Boolean);
      }}
    />
  );
}
