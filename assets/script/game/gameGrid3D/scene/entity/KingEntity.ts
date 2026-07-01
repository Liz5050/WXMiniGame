import { ComponentType } from "../components/ComponentType";
import BattleEntity from "./BattleEntity";

export default class KingEntity extends BattleEntity {
    protected onInit() {
        this.addCusComponent(ComponentType.Actor);
    }
}
