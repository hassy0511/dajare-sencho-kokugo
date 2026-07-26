import type { IslandDefinition, StageDefinition } from '../../types/content';
import type { SaveState } from '../save/state';

export type StageAccess = 'available' | 'locked' | 'planned';

export function getStageAccess(
  stages: readonly StageDefinition[],
  index: number,
  state: Pick<SaveState, 'stages'>,
): StageAccess {
  const stage = stages[index];
  if (!stage || stage.status === 'planned') return 'planned';
  if (state.stages[stage.id]?.cleared || index === 0) return 'available';
  const previous = stages[index - 1];
  return previous && state.stages[previous.id]?.cleared ? 'available' : 'locked';
}

export function getNextPlayableStage(
  island: IslandDefinition,
  stageId: string,
): StageDefinition | undefined {
  const index = island.stages.findIndex((stage) => stage.id === stageId);
  if (index < 0) return undefined;
  const next = island.stages[index + 1];
  return next?.status === 'playable' ? next : undefined;
}
