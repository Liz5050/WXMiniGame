import { Component, Vec2, Vec3, _decorator } from "cc";
import Simulator from "../../../../RVO/Simulator";
import RVOMath from "../../../../RVO/RVOMath";
import { EntityState, EntityVo } from "../../vo/EntityVo";
const {ccclass , property} = _decorator;

@ccclass 
export class GameAgent extends Component{
    public sid:number = -1;
    private _vo:EntityVo;
    protected onLoad(): void {
        
    }

    public setData(vo:EntityVo){
        this._vo = vo;
    }

    public reset(){
        Simulator.Instance.setAgentPrefVelocity(this.sid, new Vec2(0, 0));
    }

    protected update(dt: number): void {
        if(!this._vo || !this._vo.battleVo || this._vo.state != EntityState.walk) return;
        let sid = this.sid;
        if (sid >= 0)
        {
            let pos:Vec2  = Simulator.Instance.getAgentPosition(sid);
            let vel:Vec2 = Simulator.Instance.getAgentPrefVelocity(sid);
            this.node.position = new Vec3(pos.x, this.node.position.y, pos.y);
            if (Math.abs(vel.x) > 0.01 && Math.abs(vel.y) > 0.01){
                this.node.forward = new Vec3(vel.x, 0, vel.y).normalize();
            }
        }

        // if (!Input.GetMouseButton(1))
        // {
        //     Simulator.Instance.setAgentPrefVelocity(sid, new Vec2(0, 0));
        //     return;
        // }
        let agentPos:Vec2 = Simulator.Instance.getAgentPosition(sid);
        let diffX = this._vo.battleVo.pos.x - agentPos.x;
        let diffY = this._vo.battleVo.pos.z - agentPos.y;
        let goalVector:Vec2 = new Vec2(diffX,diffY);
        if (RVOMath.absSq(goalVector) > 1.0)
        {
            goalVector = RVOMath.normalize(goalVector);
        }

        Simulator.Instance.setAgentPrefVelocity(sid, goalVector);

        /* Perturb a little to avoid deadlocks due to perfect symmetry. */
        let angle:number = Math.random() * 2 * Math.PI;
        let dist:number = Math.random() * 0.0001;

        let vel:Vec2 = Simulator.Instance.getAgentPrefVelocity(sid);
        let newVec2 = new Vec2(Math.cos(angle), Math.sin(angle)).multiplyScalar(dist);
        newVec2.x += vel.x;
        newVec2.y += vel.y;
        Simulator.Instance.setAgentPrefVelocity(sid, newVec2);
    }
}