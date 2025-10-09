import { BaseState } from "./BaseState";

export class BattleState extends BaseState {
    protected onEnter(): void {
        // 进入战斗状态逻辑
    }

    protected onUpdate(dt: number): void {
        // 战斗状态更新逻辑
    }

    protected onExit(): void {
        // 退出战斗状态逻辑
    }
}