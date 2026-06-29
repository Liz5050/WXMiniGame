import { BaseEntity } from "./BaseEntity";
import { ComponentType } from "../components/ComponentType";
export class HeroEntity extends BaseEntity {
    
    protected onInit(): void {
        this.addCusComponent(ComponentType.HUD);
        this.addCusComponent(ComponentType.Battle);
        this.addCusComponent(ComponentType.RVOMove);
        this.addCusComponent(ComponentType.Actor);
    }
}
