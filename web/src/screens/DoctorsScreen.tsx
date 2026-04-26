import type { ScreenProps } from '../App';
import ItemsListScreen from '../components/ItemsListScreen';
export default function DoctorsScreen(_p: ScreenProps) {
  return (
    <ItemsListScreen
      kind="doctor"
      title="Care Team"
      eyebrow="DOCTORS · CLINICS · INSURANCE"
      icon="briefcase"
      hue={200}
      addPlaceholder="Add a doctor or clinic"
      emptyHint="Build your care team."
      
    />
  );
}
