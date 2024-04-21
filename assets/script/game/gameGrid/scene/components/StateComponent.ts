import { EntityState } from "../utils/EntityUtil";
import { BaseComponent } from "./BaseComponent";

export class StateComponent extends BaseComponent{
    private _state:EntityState;
    private _defaultState:EntityState;
}