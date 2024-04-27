import { Vec2, Vec3 } from "cc";
import Simulator from "../../../../RVO/Simulator";
import { BaseComponent } from "./BaseComponent";
import RVOMath from "../../../../RVO/RVOMath";
import { EntityState } from "../utils/EntityUtil";

export class RVOMoveComponent extends BaseComponent {
    private _sid: number = -1;
    private _agentPos:Vec2;
    private _battlePos:Vec3;
    protected onInit(): void {
        this._battlePos = new Vec3();
        this._agentPos = new Vec2();
    }

    protected onUpdate(dt: number): void {
        if (!this._vo || this._vo.isDead()) return;
        if (this._vo.state == EntityState.walk) {
            this.moving();
        }
    }

    protected updateVo(): void {
        this.node.setPosition(this._vo.pos);
        this._agentPos.x = this._vo.pos.x;
        this._agentPos.y = this._vo.pos.z;
        let sid = Simulator.Instance.addAgent(this._agentPos);
        if (sid >= 0) {
            this._sid = sid;
        }
    }

    public updatePos(){
        if(this._sid >= 0){
            this._agentPos.x = this._vo.pos.x;
            this._agentPos.y = this._vo.pos.z;
            Simulator.Instance.updateAgentPosition(this._sid,this._agentPos);
        }
    }

    public updateAgent(){
        if(this._sid >= 0){
            Simulator.Instance.setAgentPrefVelocity(this._sid, new Vec2(0, 0));
        }
    }

    protected moving(): void {
        if (!this._vo.battleVo || this._vo.battleVo.isDead()) {
            return;
        }
        this.node.parent.inverseTransformPoint(this._battlePos,this._vo.battleVo.worldPos);
        this.RVOMoving();
        this._vo.updatePos(this.node.position,this.node.worldPosition);

        // let battleVo = CacheManager.gameGrid.findTarget(this._vo.worldPos, EntityType.Grid);
        // if (!battleVo || battleVo.id == this._vo.battleVo.id) return;
        // this._vo.battleVo = battleVo;
        // this.node.parent.inverseTransformPoint(this._battlePos,this._vo.battleVo.worldPos);
    }

    private RVOMoving() {
        let sid = this._sid;
        if(sid < 0) return;
        let pos: Vec2 = Simulator.Instance.getAgentPosition(sid);
        let vel: Vec2 = Simulator.Instance.getAgentPrefVelocity(sid);
        this.node.position = new Vec3(pos.x, 0, pos.y);
        if (Math.abs(vel.x) > 0.01 && Math.abs(vel.y) > 0.01) {
            this.node.forward = new Vec3(vel.x, 0, vel.y).normalize();
        }
        
        let agentPos: Vec2 = Simulator.Instance.getAgentPosition(sid);
        let diffX = this._battlePos.x - agentPos.x;
        let diffY = this._battlePos.z - agentPos.y;
        let goalVector: Vec2 = new Vec2(diffX, diffY);
        if (RVOMath.absSq(goalVector) > 1.0) {
            goalVector = RVOMath.normalize(goalVector);
        }

        Simulator.Instance.setAgentPrefVelocity(sid, goalVector);

        /* Perturb a little to avoid deadlocks due to perfect symmetry. */
        let angle: number = Math.random() * 2 * Math.PI;
        let dist: number = Math.random() * 0.0001;

        let newVel: Vec2 = Simulator.Instance.getAgentPrefVelocity(sid);
        let newVec2 = new Vec2(Math.cos(angle), Math.sin(angle)).multiplyScalar(dist);
        newVec2.x += newVel.x;
        newVec2.y += newVel.y;
        Simulator.Instance.setAgentPrefVelocity(sid, newVec2);
    }

    protected onReset(): void {
        if(this._sid >= 0){
            Simulator.Instance.delAgent(this._sid);
            this._sid = -1;
        }
    }
}