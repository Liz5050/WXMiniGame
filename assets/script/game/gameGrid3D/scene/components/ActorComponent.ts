import { SkeletalAnimation, animation, Node } from "cc";
import { EntityAction } from "../vo/EntityAction";
import { EntityState } from "../utils/EntityUtil";
import { EntityDisplayComponent } from "./EntityDisplayComponent";

export class ActorComponent extends EntityDisplayComponent {
    private _anim: SkeletalAnimation;
    private _animCtrl:animation.AnimationController;
    private _action:EntityAction;
    private _playedAction: EntityAction;

    protected onInit(): void {
    }

    protected onViewLoaded(node: Node): void {
        if (!this.vo) return;
        this._anim = node.getComponent(SkeletalAnimation);
        if(this._anim) {
            this.playAction(this._action || this.getActionByState(this.vo.state));
        }
    }

    public playAction(action: EntityAction) {
        if(this._action === action && this._playedAction === action) return;
        if(!this._anim) {
            this._action = action;
            return;
        }
        this._action = action;
        this._playedAction = action;
        this.play(action);
    }

    private getActionByState(state: EntityState): EntityAction {
        switch (state) {
            case EntityState.walk:
                return EntityAction.Walk;
            case EntityState.attackEmpty:
            case EntityState.attackPre:
                return EntityAction.AttackPre;
            case EntityState.attack:
                return EntityAction.Attack;
            case EntityState.stiffness:
                return EntityAction.Stiffness;
            case EntityState.die:
                return EntityAction.Die;
            case EntityState.none:
            case EntityState.idle:
            default:
                return EntityAction.Idle;
        }
    }

    private play(action: EntityAction){
        switch (action) {
            case EntityAction.Idle:
                this._anim.crossFade("idle");
                break;
            case EntityAction.Walk:
                this._anim.play("walk");
                break;
            case EntityAction.AttackPre:
                this._anim.crossFade("attack-melee-left");
                break;
            case EntityAction.Attack:
                break;
            case EntityAction.AttackAfter:
                break;
            case EntityAction.Stiffness:
                this._anim.crossFade("sit");
                break;
            case EntityAction.Die:
                this._anim.play("die");
                break;
        }
    }

    protected onReset(): void {
        super.onReset();
        this._anim = null;
        this._animCtrl = null;
        this._action = null;
        this._playedAction = null;
    }
}
