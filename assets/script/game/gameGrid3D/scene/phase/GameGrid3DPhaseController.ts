import { CacheManager } from "db://assets/script/manager/CacheManager";
import BasePhaseController from "./BasePhaseController";
import BattlePhaseController from "./BattlePhaseController";
import BuildPhaseController from "./BuildPhaseController";

/** 游戏阶段枚举 */
export const enum GamePhase {
    /** 构建消除阶段 */
    Build = "build",
    /** 战斗阶段 */
    Battle = "battle",
    /** 结算阶段 */
    Settlement = "settlement",
}

/**
 * 阶段总调度器。
 *
 * 职责：
 *   - 持有当前阶段状态。
 *   - 根据外部指令切换阶段（构建 → 战斗 → 结算）。
 *   - 只负责调度，不处理具体的战斗或构建逻辑，将细节委托给对应的阶段控制器。
 *
 * 使用方：GameGrid3DController 或顶层流程在恰当时机调用 switchPhase()。
 */
export default class GameGrid3DPhaseController {
    private _currentPhase: GamePhase = null;
    private _phaseMap: { [phase: string]: BasePhaseController } = {};

    public constructor() {
        this._phaseMap[GamePhase.Build] = new BuildPhaseController();
        this._phaseMap[GamePhase.Battle] = new BattlePhaseController();
    }

    /** 当前所处阶段 */
    public get currentPhase(): GamePhase {
        return this._currentPhase;
    }

    /**
     * 切换到指定阶段。
     * 会先退出当前阶段，再进入目标阶段。
     */
    public switchPhase(next: GamePhase): void {
        if (this._currentPhase === next) return;

        this.exitCurrentPhase();
        this._currentPhase = next;
        this.syncCachePhase(next);
        this.enterCurrentPhase();
    }

    /** 切换到构建阶段 */
    public switchToBuild(): void {
        this.switchPhase(GamePhase.Build);
    }

    /** 切换到战斗阶段 */
    public switchToBattle(): void {
        this.switchPhase(GamePhase.Battle);
    }

    /** 销毁时清理当前阶段资源 */
    public dispose(): void {
        this.exitCurrentPhase();
        for (const phase in this._phaseMap) {
            this._phaseMap[phase].dispose();
        }
        this._phaseMap = {};
        this._currentPhase = null;
    }

    // ------------------------------------------------------------------ private

    private exitCurrentPhase(): void {
        const phase = this.getCurrentPhaseController();
        phase && phase.exit();
    }

    private enterCurrentPhase(): void {
        const phase = this.getCurrentPhaseController();
        phase && phase.enter();
    }

    private getCurrentPhaseController(): BasePhaseController {
        return this._phaseMap[this._currentPhase];
    }

    private syncCachePhase(next: GamePhase): void {
        switch (next) {
            case GamePhase.Build:
                CacheManager.gameGrid3D.switchToBuild(true);
                break;
            case GamePhase.Battle:
                CacheManager.gameGrid3D.switchToBattle(true);
                break;
            case GamePhase.Settlement:
                // TODO: 接入结算阶段状态
                break;
        }
    }
}
