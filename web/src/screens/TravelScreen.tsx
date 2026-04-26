import type { ScreenProps } from '../App';
import ItemsListScreen from '../components/ItemsListScreen';
export default function TravelScreen(_p: ScreenProps) {
  return (
    <ItemsListScreen
      kind="trip"
      title="Travel"
      eyebrow="TRIPS · PACKING · DOCS"
      icon="location"
      hue={200}
      addPlaceholder="Add a trip"
      emptyHint="Where are you going next?"
      withDate
    />
  );
}
