import type { ScreenProps } from '../App';
import ItemsListScreen from '../components/ItemsListScreen';

export default function BirthdaysScreen(_p: ScreenProps) {
  return (
    <ItemsListScreen
      kind="birthday"
      title="Birthdays"
      eyebrow="REMEMBER · GIFT · CELEBRATE"
      icon="calendar"
      hue={320}
      addPlaceholder="Whose birthday?"
      emptyHint="Add a name + date and Nik will remind you."
      withDate
      renderMeta={(item) => {
        if (!item.occurs_at) return null;
        const days = Math.ceil((new Date(item.occurs_at).getTime() - Date.now()) / 86_400_000);
        if (days < 0) return <span>past</span>;
        if (days === 0) return <span style={{ color: 'oklch(0.92 0.16 320)' }}>today!</span>;
        if (days < 30) return <span>in {days}d</span>;
        return <span>in {Math.round(days / 30)}mo</span>;
      }}
    />
  );
}
