import type { ScreenProps } from '../App';
import ItemsListScreen from '../components/ItemsListScreen';
export default function NetworkScreen(_p: ScreenProps) {
  return (
    <ItemsListScreen
      kind="contact"
      title="Network"
      eyebrow="REACH-OUTS · INTROS"
      icon="briefcase"
      hue={220}
      addPlaceholder="Add a contact"
      emptyHint="Build your network."
      
    />
  );
}
