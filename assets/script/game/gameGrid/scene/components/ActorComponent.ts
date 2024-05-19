import { SkeletalAnimation, Node, instantiate, Prefab, animation } from "cc";
import { BaseComponent } from "./BaseComponent";
import { EntityAction } from "../vo/EntityAction";
import Mgr from "../../../../manager/Mgr";

export class ActorComponent extends BaseComponent {
    private _bodyContainer: Node = null;
    private _bodyModel: Node;
    private _anim: SkeletalAnimation;
    private _animCtrl:animation.AnimationController;
    private _action:EntityAction;
    protected onInit(): void {
        this._bodyContainer = this.node.getChildByName("body");
        
        // this._battlePos = new Vec3();
        // this._agentPos = new Vec2();
    }

    protected updateVo(): void {
        if (!this._bodyModel) {
            Mgr.loader.LoadBundleRes("model",this.vo.modelUrl,(prefab:Prefab)=>{
                this._bodyModel = instantiate(prefab);
                // this._bodyModel.setScale(2.8, 2.8, 2.8);
                this._bodyContainer.addChild(this._bodyModel);

                this._anim = this._bodyModel.getComponent(SkeletalAnimation);
                if(this._action) {
                    this.play(this._action);
                }
                else{
                    this.playAction(EntityAction.Idle);
                }
            });
        }
    }

    public playAction(action: EntityAction) {
        if(this._action === action) return;
        if(!this._anim) {
            this._action = action;
            return;
        }
        this._action = action;
        this.play(action);
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
}