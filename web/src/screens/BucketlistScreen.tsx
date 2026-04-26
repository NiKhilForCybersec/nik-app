import type { ScreenProps } from '../App';
import ItemsListScreen from '../components/ItemsListScreen';
export default function BucketlistScreen(_p: ScreenProps) {
  return (
    <ItemsListScreen
      kind="bucket_list"
      title="Bucket List"
      eyebrow="DREAMS · STEPS · DONE"
      icon="target"
      hue={320}
      addPlaceholder="Add a dream"
      emptyHint="Things you want to do."
      
    />
  );
}
