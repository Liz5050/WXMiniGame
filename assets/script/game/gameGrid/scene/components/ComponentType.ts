import { ActorComponent } from "./ActorComponent";
import { BattleComponent } from "./BattleComponent";
import { HUDComponent } from "./HUDComponent";
import { RVOMoveComponent } from "./RVOMoveComponent";

export enum ComponentType {
    State = 1,
    Movement,
    Skill,
    Buff,
    Battle,
    Hp,
    HUD,
    RVOMove,
    Actor,
}

export class ComponentFactory {
    public static getComponentCls(type:ComponentType){
        switch(type){
            case ComponentType.HUD:
                return HUDComponent;
            case ComponentType.RVOMove:
                return RVOMoveComponent;
            case ComponentType.Battle:
                return BattleComponent;
            case ComponentType.Actor:
                return ActorComponent;
            default:
                return null;
        }
    }
}