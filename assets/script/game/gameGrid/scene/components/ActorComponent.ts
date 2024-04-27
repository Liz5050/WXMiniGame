import { AnimationState, SkeletalAnimation } from "cc";
import { BaseComponent } from "./BaseComponent";

export class ActorComponent extends BaseComponent{
    private _bodyModel: Node;
    private _anim: SkeletalAnimation;
    private _animStateIdle: AnimationState;
    protected onInit(): void {
        
    }

    protected updateVo(): void {
        
    }
}