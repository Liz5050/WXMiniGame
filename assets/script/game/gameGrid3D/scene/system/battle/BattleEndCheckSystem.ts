import BaseSystem from "../BaseSystem";
import { CacheManager } from "db://assets/script/manager/CacheManager";
import { EntityType } from "../../utils/EntityUtil";

/** 战斗结束原因 */
export const enum BattleEndReason {
    /** 核心据点生命值归零 */
    KingDead = "king_dead",
    /** 场上敌人全部消灭 */
    AllEnemyDead = "all_enemy_dead",
}

/**
 * 战斗结束检测系统。
 *
 * 职责：
 *   - 每帧检查"核心据点是否死亡"与"敌人是否全灭"。
 *   - 满足任意一条结束条件时，触发回调并停止自身。
 *   - 第一版只实现核心死亡与敌人全灭两种条件；后续可扩展超时等。
 *
 * 不直接控制阶段跳转，只通过回调通知外部（BattlePhaseController）。
 */
export default class BattleEndCheckSystem extends BaseSystem {
    /** 战斗结束时的回调，参数为是否胜利 */
    private _onEnd: (isVictory: boolean, reason: BattleEndReason) => void;
    /** 防止同一局内重复触发 */
    private _ended: boolean = false;

    /**
     * @param onEnd 战斗结束回调，由 BattlePhaseController 注入
     */
    public constructor(onEnd: (isVictory: boolean, reason: BattleEndReason) => void) {
        super();
        this._onEnd = onEnd;
    }

    protected onStart(): void {
        this._ended = false;
    }

    protected onStop(): void {
        this._ended = false;
    }

    protected onUpdate(dt: number): void {
        if (this._ended) return;

        if (this.isKingDead()) {
            this.triggerEnd(BattleEndReason.KingDead);
            return;
        }

        if (this.isAllEnemyDead()) {
            this.triggerEnd(BattleEndReason.AllEnemyDead);
        }
    }

    // ------------------------------------------------------------------ private

    /** 检测核心据点是否死亡 */
    private isKingDead(): boolean {
        const kingVo = CacheManager.gameGrid3D.getKingVo();
        return kingVo ? kingVo.isDead() : false;
    }

    /** 检测场上敌人是否全部死亡 */
    private isAllEnemyDead(): boolean {
        const enemies = CacheManager.gameGrid3D.getAliveEntities(EntityType.Enemy);
        return enemies.length === 0;
    }

    private triggerEnd(reason: BattleEndReason): void {
        this._ended = true;
        this.stop();
        const isVictory = reason === BattleEndReason.AllEnemyDead;
        console.log(`[BattleEndCheckSystem] 战斗结束，原因：${reason}`);
        this._onEnd(isVictory, reason);
    }
}
