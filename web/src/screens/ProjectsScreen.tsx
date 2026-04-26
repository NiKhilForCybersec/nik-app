import type { ScreenProps } from '../App';
import ItemsListScreen from '../components/ItemsListScreen';
export default function ProjectsScreen(_p: ScreenProps) {
  return (
    <ItemsListScreen
      kind="project"
      title="Projects"
      eyebrow="ACTIVE · SPRINTS · LOG"
      icon="briefcase"
      hue={220}
      addPlaceholder="Add a project"
      emptyHint="What are you building?"
      
    />
  );
}
