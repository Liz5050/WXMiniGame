import { CacheManager } from "../../../../manager/CacheManager";
import { EntityState, EntityType, EntityUtil } from "../utils/EntityUtil";
import { EntityComponent } from "./EntityComponent";
import { StateMachine } from "../statemachine/StateMachine";
import { IdleState } from "../statemachine/IdleState";
import { BattleState } from "../statemachine/BattleState";

export class BattleComponent extends EntityComponent{
    private _searchTypes:EntityType[];
    private _stateMachine: StateMachine;
    
    protected onInit(): void {
        this._stateMachine = new StateMachine();
        // 初始化状态机，默认进入空闲状态
        this._stateMachine.changeState(new IdleState());
    }

    protected updateVo(): void {
        if(EntityUtil.isGrid(this._vo.type)){
            this._searchTypes = [EntityType.Enemy];
        }
        else if(EntityUtil.isEnemy(this._vo.type)){
            this._searchTypes = [EntityType.Grid,EntityType.GridHero];
        }
    }

    protected onUpdate(dt: number): void {
        if (!this._vo || this._vo.isDead() || !this._searchTypes) return;
        if(!CacheManager.gameGrid.isBattle()) {
            this._vo.setState(EntityState.idle);
            return;
        }
        // 状态机更新
        this._stateMachine.update(dt);
    }
}