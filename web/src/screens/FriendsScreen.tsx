import type { ScreenProps } from '../App';
import ItemsListScreen from '../components/ItemsListScreen';
export default function FriendsScreen(_p: ScreenProps) {
  return (
    <ItemsListScreen
      kind="friend"
      title="Friends"
      eyebrow="TOUCH · PLANS · BIRTHDAYS"
      icon="users"
      hue={280}
      addPlaceholder="Add a friend"
      emptyHint="Who matters to you?"
      
    />
  );
}
