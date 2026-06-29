/**
 * 游戏功能系统基类。
 *
 * System 在此架构中不是 ECS 的 System，而是封装特定业务逻辑的功能单元。
 * 每个子类只负责单一职责，例如单位生成、战斗结束检测等。
 *
 * 生命周期：
 *   start() → 每帧 update(dt) → stop()
 *
 * 子类按需重写 onStart / onUpdate / onStop，不需要 update 的系统可以不重写 onUpdate。
 */
export default abstract class BaseSystem {
    private _running: boolean = false;

    /** 系统是否正在运行 */
    public get isRunning(): boolean {
        return this._running;
    }

    /** 启动系统，执行初始化逻辑 */
    public start(): void {
        if (this._running) return;
        this._running = true;
        this.onStart();
    }

    /** 停止系统，执行清理逻辑 */
    public stop(): void {
        if (!this._running) return;
        this._running = false;
        this.onStop();
    }

    /**
     * 每帧驱动。由外部（如 BattleSystem 或阶段控制器）统一调用。
     * 系统未运行时自动跳过。
     */
    public update(dt: number): void {
        if (!this._running) return;
        this.onUpdate(dt);
    }

    /** 子类实现：系统启动时的初始化 */
    protected onStart(): void {}

    /** 子类实现：系统停止时的清理 */
    protected onStop(): void {}

    /** 子类实现：每帧逻辑（不需要帧更新的系统可以不重写） */
    protected onUpdate(dt: number): void {}
}
