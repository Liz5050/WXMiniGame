/** Grid3D 阶段控制器基类 */
export default abstract class BasePhaseController {
    private _isActive: boolean = false;

    /** 当前阶段是否已进入 */
    public get isActive(): boolean {
        return this._isActive;
    }

    /** 进入阶段，重复进入会被忽略 */
    public enter(): void {
        if (this._isActive) return;
        this._isActive = true;
        this.onEnter();
    }

    /** 退出阶段，重复退出会被忽略 */
    public exit(): void {
        if (!this._isActive) return;
        this._isActive = false;
        this.onExit();
    }

    /** 销毁阶段控制器 */
    public dispose(): void {
        this.exit();
        this.onDispose();
    }

    /** 子类实现：进入阶段 */
    protected onEnter(): void {}

    /** 子类实现：退出阶段 */
    protected onExit(): void {}

    /** 子类实现：销毁阶段资源 */
    protected onDispose(): void {}
}
