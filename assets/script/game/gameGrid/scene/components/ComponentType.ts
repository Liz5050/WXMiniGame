import { ActorComponent } from "./ActorComponent";
import { EntityComponent } from "./EntityComponent";
import { BattleComponent } from "./BattleComponent";
import { HUDComponent } from "./HUDComponent";
import { RVOMoveComponent } from "./RVOMoveComponent";

export enum ComponentType {
    State = "StateComponent",
    Movement = "MovementComponent",
    Skill = "SkillComponent",
    Buff = "BuffComponent",
    Battle = "BattleComponent",
    Hp = "HpComponent",
    HUD = "HUDComponent",
    RVOMove = "RVOMoveComponent",
    Actor = "ActorComponent",
}

export class ComponentFactory {
    private static _comps:Map<string,EntityComponent[]> = new Map();
    public static createComponent(type:ComponentType):EntityComponent{
        const list:EntityComponent[] = ComponentFactory._comps.get(type);
        if(list.length > 0){
            return list.shift();
        }

        switch(type){
            case ComponentType.HUD:
                return new HUDComponent();
            case ComponentType.RVOMove:
                return new RVOMoveComponent();
            case ComponentType.Battle:
                return new BattleComponent();
            case ComponentType.Actor:
                return new ActorComponent();
            default:
                return null;
        }
    }

    public static recycleComponent(comp:EntityComponent){
        let list = ComponentFactory._comps.get(comp.type);
        if(!list){
            list = [];
            ComponentFactory._comps.set(comp.type,list);
        }
        list.push(comp);
    }
}