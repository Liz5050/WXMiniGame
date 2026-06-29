import { Node, Vec3, tween, instantiate, Tween } from "cc";
import Mgr from "../../../../manager/Mgr";
import MathUtils from "../../../../utils/MathUtils";
import { EntityDisplayComponent } from "./EntityDisplayComponent";
import { EntityState } from "../utils/EntityUtil";

export class SkillComponent extends EntityDisplayComponent{
    private _bodyNode: Node = null;
    private _battlePos:Vec3;
    private _atkTime:number;

    protected onInit(): void {
        this._battlePos = new Vec3();
    }

    protected updateVo(): void {
        this._bodyNode = this._viewRoot;
    }

    protected onDisplayVoPropUpdate(evt: { key: OwnKeys<EntityVo>; val: any }): void {
        if (evt.key !== "state") return;
        if (this._vo.state === EntityState.attackPre) {
            this.playPre();
        }
        else if (this._vo.state === EntityState.attack) {
            this.playAttack();
        }
    }

    public playSkill(skillId:number,step:string){
        switch(skillId){
            case 1:
                if(step == "pre") {
                    this.pre1();
                }
                else{
                    this.atk1();
                }
                break;
            case 2:
                if(step == "pre") {
                    this.pre2();
                }
                else{
                    this.atk2();
                }
                break;
        }
    }

    public playPre(){
        if(!this._vo || !this._bodyNode) return;
        let skillId = this._vo.getNextSkillId();
        const fn = this["pre"+skillId];
        if (fn) fn.call(this);
    }

    public playAttack(){
        if(!this._vo || !this._bodyNode) return;
        let skillId = this._vo.getNextSkillId();
        const fn = this["atk"+skillId];
        if (fn) fn.call(this);
    }

    private pre1(){
        this._atkTime = this._vo.atkTime;
        let delay = this._vo["atkDelay"];
        let preTime = this._vo.atkPretime - delay;
        if(this._vo.battleVo){
            this.displayParent.inverseTransformPoint(this._battlePos,this._vo.battleVo.worldPos);
        }
        else{
            this._battlePos.set(this._vo.pos.x,0,-10);
            delay = 0;
        }
        Mgr.soundMgr.play("skill/skill_cm3_2",false);
        tween(this._bodyNode).delay(delay / 1000).to(preTime / 1000,{position:new Vec3(0,5,0),scale:new Vec3(2,2,2)}).start();
    }

    private atk1(){
        if(!this._bodyNode) return;
        tween(this._bodyNode)
        .to(this._atkTime / 1000,{position:new Vec3(this._battlePos.x,0,this._battlePos.z),scale:new Vec3(0.05,0.05,0.05)}).delay(0.1)
        .call(()=>{
            if (this._bodyNode.active) this._bodyNode.active = false;
        })
        .start();
    }

    private _skillNode:Node;
    private pre2(){
        if(this._skillNode) {
            Tween.stopAllByTarget(this._skillNode);
            this._skillNode.setPosition(0,0,0);
            this._skillNode.setScale(1,1,1);
            this._skillNode.setRotationFromEuler(0,0,0);
        }
        else{
            this._skillNode = instantiate(this._bodyNode);
            this.displayParent.addChild(this._skillNode);
        }
        this._atkTime = this._vo.atkTime;
        let delay = this._vo["atkDelay"];
        let preTime = this._vo.atkPretime - delay;
        if(this._vo.battleVo){
            this.displayParent.inverseTransformPoint(this._battlePos,this._vo.battleVo.worldPos);
        }
        else{
            this._battlePos.set(this._vo.pos.x,0,-10);
            delay = 0;
        }
        Mgr.soundMgr.play("skill/skill_cm3_2",false);
        tween(this._skillNode).delay(delay / 1000).to(preTime / 1000,{position:new Vec3(0,5,0),scale:new Vec3(2,2,2)}).start();
    }

    private atk2(){
        if(!this._skillNode) return;
        tween(this._skillNode)
        .to(this._atkTime / 1000,{position:new Vec3(this._battlePos.x,0,this._battlePos.z),scale:new Vec3(0.05,0.05,0.05)}).delay(0.1)
        .call(()=>{
            if(this._skillNode) {
                this._skillNode.destroy();
                this._skillNode = null;
            }
            // if (this._skillNode.active) this._skillNode.active = false;
        })
        .start();
    }

    private atkEffect2(){
        if(!this._vo || !this._vo.battleVo || !this._bodyNode) return;
        let delay = this._vo["atkDelay"];
        let preTime = this._vo.atkPretime - delay;
        this.displayParent.inverseTransformPoint(this._battlePos,this._vo.battleVo.worldPos);
        Mgr.soundMgr.play("skill/skill_cm3_2",false);
        tween(this._bodyNode).to(0.2,{position:new Vec3(0,5,this._battlePos.z),scale:new Vec3(0.5,1.5,0.05)},{onUpdate:()=>{
            let angle = MathUtils.getAngle2(this.displayParent.position.x,this.displayParent.position.y,this._battlePos.x,this._battlePos.y);
            this._bodyNode.forward = this._battlePos;
            this._bodyNode.setRotationFromEuler(angle,0,0);
        }}).start();
    }

    protected onReset(): void {
        if (this._bodyNode) {
            Tween.stopAllByTarget(this._bodyNode);
        }
        if (this._skillNode) {
            Tween.stopAllByTarget(this._skillNode);
            this._skillNode.destroy();
            this._skillNode = null;
        }
        this._bodyNode = null;
        super.onReset();
    }
}
