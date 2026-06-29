import { CameraType, Root3D } from "db://assets/script/Root3D";
import { CacheManager } from "db://assets/script/manager/CacheManager";
import { GEvent } from "db://assets/script/enum/GEvent";
import { dispatchMsg } from "db://assets/script/utils/MessageCenter";
import { EntityType } from "../utils/EntityUtil";
import EntityVo from "../vo/EntityVo";
import BasePhaseController from "./BasePhaseController";
import { BattleEndReason } from "../system/battle/BattleEndCheckSystem";
import BattleEndCheckSystem from "../system/battle/BattleEndCheckSystem";
import BattleSystem from "../system/battle/BattleSystem";
import BattleUnitSpawnSystem from "../system/battle/BattleUnitSpawnSystem";

/**
 * 战斗阶段控制器。
 *
 * 职责：
 *   - 进入战斗阶段：切换战斗视角、触发我方单位生成、启动敌人生成、启动战斗系统。
 *   - 退出战斗阶段：停止所有战斗系统、清理场上实体、切回构建视角。
 *   - 监听战斗结束信号（由 BattleEndCheckSystem 产生），委托给阶段控制器做阶段跳转。
 *
 * 只调用系统，不自己循环创建或销毁单位实体。
 */
export default class BattlePhaseController extends BasePhaseController {
    private _battleSystem: BattleSystem;
    private _spawnSystem: BattleUnitSpawnSystem;
    private _endCheckSystem: BattleEndCheckSystem;

    public constructor() {
        super();
        this._spawnSystem = new BattleUnitSpawnSystem();
        this._endCheckSystem = new BattleEndCheckSystem(this.onBattleEnd.bind(this));
        this._battleSystem = new BattleSystem([this._endCheckSystem]);
    }

    /**
     * 进入战斗阶段。
     * 由 GameGrid3DPhaseController 调用。
     */
    protected onEnter(): void {
        Root3D.instance && Root3D.instance.switchCamera(CameraType.BattleView);
        dispatchMsg(GEvent.OnGameGrid3DBattlePhaseEnter);

        // 1. 显示核心据点
        this.spawnKing();

        // 2. 生成本轮我方战斗单位（一次性，每格仅生成 1 次）
        this._spawnSystem.spawnAll();

        // 3. 投放当前回合敌人
        this.spawnEnemies();

        // 4. 启动战斗驱动（ComponentSystem + 子系统帧更新）
        this._battleSystem.start();
    }

    /**
     * 退出战斗阶段。
     * 由 GameGrid3DPhaseController 调用。
     */
    protected onExit(): void {
        this._battleSystem.stop();
        CacheManager.gameGrid3D.sceneReady = false;
        CacheManager.gameGrid3D.clearBattleEntities();
        this.hideKing();
        CacheManager.gameGrid3D.resetBattleGridSummonState();
        dispatchMsg(GEvent.OnGameGrid3DBattlePhaseExit);
    }

    // ------------------------------------------------------------------ private

    /**
     * 战斗结束回调，由 BattleEndCheckSystem 触发。
     * @param isVictory 敌人全灭为胜利，据点死亡为失败
     */
    private onBattleEnd(isVictory: boolean, reason: BattleEndReason): void {
        dispatchMsg(GEvent.OnGameGrid3DBattleResult, { isVictory, reason });
        console.log(`[战斗阶段] 战斗结束，${isVictory ? "胜利" : "失败"}`);
    }

    /** 第一版先按回合数投放基础敌人 */
    private spawnEnemies(): void {
        const count = Math.max(CacheManager.gameGrid3D.round, 1);
        const list: EntityVo[] = CacheManager.gameGrid3D.addEntityByNum(EntityType.Enemy, count);
        dispatchMsg(GEvent.OnGameGrid3DEntityInit, list);
    }

    private spawnKing(): void {
        const kingVo = CacheManager.gameGrid3D.getKingVo();
        if (!kingVo) return;
        dispatchMsg(GEvent.OnGameGrid3DEntityInit, [kingVo]);
    }

    private hideKing(): void {
        const kingVo = CacheManager.gameGrid3D.getKingVo();
        if (!kingVo) return;
        dispatchMsg(GEvent.OnGameGrid3DEntityDelete, kingVo.entityId);
    }
}
