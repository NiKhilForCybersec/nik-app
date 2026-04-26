import type { ScreenProps } from '../App';
import ItemsListScreen from '../components/ItemsListScreen';
export default function InvestmentsScreen(_p: ScreenProps) {
  return (
    <ItemsListScreen
      kind="investment"
      title="Investments"
      eyebrow="PORTFOLIO · TRENDS"
      icon="trend"
      hue={150}
      addPlaceholder="Add an investment"
      emptyHint="Track your wealth."
      
    />
  );
}
