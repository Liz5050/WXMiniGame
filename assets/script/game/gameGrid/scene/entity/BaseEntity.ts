import { Component, _decorator } from "cc";
import { EntityState, EntityVo } from "../../vo/EntityVo";
const { ccclass, property } = _decorator;

@ccclass
export class BaseEntity extends Component {
    protected _vo: EntityVo;
    protected _playState: EntityState;
    protected _deltaTime: number = 0;
    protected _updateInterval: number = 0.5;
    protected onLoad(): void {
        this.init();
    }

    public hurt() {
        this.playHurt();
    }

    protected update(dt: number): void {
        this._deltaTime += dt;
        if (!this.canUpdate()) return;
        this._deltaTime = 0;
        this.updateSub(dt);
    }

    protected updateSub(dt: number) { }

    protected canUpdate(): boolean {
        return this._deltaTime >= this._updateInterval
    }

    public setData(vo: EntityVo) {
        this._vo = vo;
        this._vo.setEntity(this);
        this.onEntityVoUpdate();
    }
    //VO层同步状态
    public setStateFromVo(state:EntityState){
        this.setState(state);
    }
    protected init() { }
    protected onEntityVoUpdate() { }
    protected setState(state: EntityState): boolean {
        if (!this._vo.setState(state)) return false;
        switch (state) {
            case EntityState.idle:
                this.onIdle();
                break;
            case EntityState.walk:
                this.onWalk();
                break;
            case EntityState.attackPre:
                this.onAttackPre();
                break;
            case EntityState.attack:
                this.onAttack();
                break;
            case EntityState.attackAfter:
                break;
            case EntityState.stiffness:
                this.onStiffness();
                break;
            case EntityState.die:
                this.onDie();
                break;
        }
        this._playState = this._vo.state;
        this.onStateChanged(state);
        return true;
    }
    private onIdle() {
        this.playIdle();
    };
    private onWalk() {
        this.playWalk();
    };
    private onAttackPre() {
        this.playAttackPre();
    }
    private onAttack() {
        this.playAttack();
    };
    private onStiffness() {
        this.playStiffness();
    };
    private onDie() {
        this.playDie();
    };
    protected onStateChanged(state: EntityState) { }
    protected playIdle() { }
    protected playWalk() { }
    protected moving() { }
    protected playAttackPre() { }
    protected playAttack() { }
    protected playStiffness() { }
    protected playDie() { }
    protected playHurt() { }
    protected stopMove() { }

}