import { Component, Node, Vec3, _decorator, tween } from "cc";
import { EntityVo } from "../../vo/EntityVo";
import Mgr from "../../../../manager/Mgr";
import MathUtils from "../../../../utils/MathUtils";
const { ccclass, property } = _decorator;

@ccclass
export class SkillComponent extends Component{
    @property(Node) bodyNode: Node = null;
    private _vo:EntityVo;
    private _battlePos:Vec3;
    private _atkTime:number;
    protected onLoad(): void {
        this._battlePos = new Vec3();
    }
    public setData(vo:EntityVo){
        this._vo = vo;
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
        }
    }

    private pre1(){
        this._atkTime = this._vo.atkTime;
        let delay = this._vo["atkDelay"];
        let preTime = this._vo.atkPretime - delay;
        if(this._vo.battleVo){
            this.node.inverseTransformPoint(this._battlePos,this._vo.battleVo.worldPos);
        }
        else{
            this._battlePos.set(this._vo.pos.x,0,-10);
            delay = 0;
        }
        Mgr.soundMgr.play("skill/skill_cm3_2",false);
        tween(this.bodyNode).delay(delay / 1000).to(preTime / 1000,{position:new Vec3(0,5,0),scale:new Vec3(2,2,2)}).start();
    }

    private atk1(){
        tween(this.bodyNode)
        .to(this._atkTime / 1000,{position:new Vec3(this._battlePos.x,0,this._battlePos.z),scale:new Vec3(0.05,0.05,0.05)}).delay(0.1)
        .call(()=>{
            if (this.bodyNode.active) this.bodyNode.active = false;
        })
        .start();
    }

    private atkEffect2(){
        let delay = this._vo["atkDelay"];
        let preTime = this._vo.atkPretime - delay;
        this.node.inverseTransformPoint(this._battlePos,this._vo.battleVo.worldPos);
        Mgr.soundMgr.play("skill/skill_cm3_2",false);
        tween(this.bodyNode).to(0.2,{position:new Vec3(0,5,this._battlePos.z),scale:new Vec3(0.5,1.5,0.05)},{onUpdate:()=>{
            let angle = MathUtils.getAngle2(this.node.position.x,this.node.position.y,this._battlePos.x,this._battlePos.y);
            this.bodyNode.forward = this._battlePos;
            this.bodyNode.setRotationFromEuler(angle,0,0);
        }}).start();
    }
}