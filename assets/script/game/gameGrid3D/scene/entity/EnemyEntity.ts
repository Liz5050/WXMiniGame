import { ComponentType } from "../components/ComponentType";
import BattleEntity from "./BattleEntity";

export default class EnemyEntity extends BattleEntity {
    protected onInit(): void {
        this._updateInterval = 0;
        this.addCusComponent(ComponentType.HUD);
        this.addCusComponent(ComponentType.Battle);
        this.addCusComponent(ComponentType.RVOMove);
        this.addCusComponent(ComponentType.Actor);
    }
}
