import { PlayerContainerAction } from "./actions/player-container-action";
import { MutationObserverHandler } from "./mutation-handler";

new MutationObserverHandler(
	new PlayerContainerAction(),
)