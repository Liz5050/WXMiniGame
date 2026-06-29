import BaseSystem from "../BaseSystem";
import ComponentSystem from "../../components/ComponentSystem";
import { TimerManager } from "db://assets/script/manager/TimerManager";

/**
 * 战斗系统总入口。
 *
 * 职责：
 *   - 启动/停止 ComponentSystem（驱动寻敌、移动、技能、死亡等实体组件）。
 *   - 统一管理并驱动战斗相关子系统（如 BattleEndCheckSystem）的每帧 update。
 *   - 作为战斗阶段的调度包装，不直接实现具体战斗规则。
 *
 * 若后续需要多个子系统（AI 系统、Buff 系统等），直接在构造时注入并在 onUpdate 中统一驱动。
 */
export default class BattleSystem extends BaseSystem {
    /** 需要由本系统统一驱动 update 的子系统列表 */
    private _subSystems: BaseSystem[];
    private _timerId: number = -1;

    /**
     * @param subSystems 需要随战斗阶段同步 start/stop/update 的子系统列表
     */
    public constructor(subSystems: BaseSystem[] = []) {
        super();
        this._subSystems = subSystems;
    }

    protected onStart(): void {
        this._lastTime = Date.now();
        // 启动实体组件驱动（寻敌、移动、技能、动画等）
        ComponentSystem.start();

        // 启动所有子系统
        for (const sys of this._subSystems) {
            sys.start();
        }

        // 用定时器驱动子系统 update（与 ComponentSystem 的内部定时器频率保持一致）
        this._timerId = TimerManager.instance.doTimer(0, 0, this.onTick, this);
    }

    protected onStop(): void {
        // 停止定时器
        if (this._timerId >= 0) {
            TimerManager.instance.removeById(this._timerId);
            this._timerId = -1;
        }

        // 停止所有子系统
        for (const sys of this._subSystems) {
            sys.stop();
        }

        // 停止实体组件驱动并清理组件引用
        ComponentSystem.stop();
        ComponentSystem.removeAllComponents();
    }

    // ------------------------------------------------------------------ private

    private _lastTime: number = 0;

    private onTick(): void {
        const now = Date.now();
        const dt = this._lastTime > 0 ? (now - this._lastTime) / 1000 : 0;
        this._lastTime = now;

        for (const sys of this._subSystems) {
            sys.update(dt);
        }
    }
}
