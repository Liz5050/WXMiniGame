import { EntityState } from "../utils/EntityUtil";
import { EntityComponent } from "./EntityComponent";

export class StateComponent extends EntityComponent{
    private _state:EntityState;
    private _defaultState:EntityState;
}