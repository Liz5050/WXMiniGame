import { AnimationState, BoxCollider, Node, ParticleSystem, Prefab, SkeletalAnimation, Vec2, Vec3, _decorator, instantiate, math, tween } from "cc";
import { EntityState, EntityType, EntityVo } from "../../vo/EntityVo";
import { CacheManager } from "../../../../manager/CacheManager";
import { BaseEntity } from "./BaseEntity";
import Simulator from "../../../../RVO/Simulator";
import RVOMath from "../../../../RVO/RVOMath";
import Mgr from "../../../../manager/Mgr";

const { ccclass, property } = _decorator;

@ccclass
export class GameGridEnemy extends BaseEntity {
    @property(Prefab) model: Prefab = null;
    @property(Node) bodyContainer: Node = null;
    @property(BoxCollider) collider: BoxCollider = null;
    @property(ParticleSystem) hit: ParticleSystem;
    private _bodyModel: Node;
    private _anim: SkeletalAnimation;
    private _animStateIdle: AnimationState;

    public sid: number = -1;
    private _agentPos:Vec2;
    private _battlePos:Vec3;
    protected init(): void {
        if (!this._bodyModel) {
            this._bodyModel = instantiate(this.model);
            this._bodyModel.setScale(2.8, 2.8, 2.8);
            this.bodyContainer.addChild(this._bodyModel);
        }
        this._battlePos = new Vec3();
        this._anim = this._bodyModel.getComponent(SkeletalAnimation);
        this._animStateIdle = this._anim.getState("idle");
        this._anim.play("idle");
        this._updateInterval = 0;
        this._agentPos = new Vec2();
    }

    protected updateSub(dt: number): void {
        if (!this._vo || this._vo.isDead()) return;
        if (this._vo.state == EntityState.idle) {
            if (!this._vo.battleVo || this._vo.battleVo.isDead()) {
                let battleVo = CacheManager.gameGrid.findTarget(this._vo.worldPos, EntityType.Grid);
                if (!battleVo) return;
                this._vo.battleVo = battleVo;
                this.node.parent.inverseTransformPoint(this._battlePos,battleVo.worldPos);
            }
            if (this._vo.isAttackRange()) {
                this.setState(EntityState.attackPre);
            }
            else {
                this.setState(EntityState.walk);
            }
        }
        else if (this._vo.state == EntityState.walk) {
            this.moving();
        }
    }

    protected playIdle(): void {
        console.log("play enemy idle")
        this._anim.crossFade("idle");
        Simulator.Instance.setAgentPrefVelocity(this.sid, new Vec2(0, 0));
    }

    protected playAttackPre() {
        this._anim.crossFade("attack-melee-left");
        Simulator.Instance.setAgentPrefVelocity(this.sid, new Vec2(0, 0));
    }

    protected playDie(): void {
        this._anim.play("die");
        Simulator.Instance.setAgentPrefVelocity(this.sid, new Vec2(0, 0));
    }

    protected playWalk() {
        this._anim.play("walk");
    }

    protected playStiffness(): void {
        Mgr.soundMgr.play("damage03");
        this.hit.play();
        this._anim.crossFade("sit");
        Simulator.Instance.setAgentPrefVelocity(this.sid, new Vec2(0, 0));
        this._agentPos.x = this._vo.pos.x;
        this._agentPos.y = this._vo.pos.z - 1;
        Simulator.Instance.updateAgentPosition(this.sid,this._agentPos);
        let curPos = this.node.position;
        tween(this.node).to(0.2,{position:new Vec3(curPos.x,curPos.y,curPos.z - 1)}).start();
    }

    protected moving(): void {
        if (!this._vo.battleVo || this._vo.battleVo.isDead()) {
            //移动过程中，目标消失，死亡，或者可攻击时设置idle状态
            this.setState(EntityState.idle);
            return;
        }
        if (this._vo.isAttackRange()) {
            this.setState(EntityState.attackPre);
            return;
        }
        this.RVOMoving();
        this._vo.updatePos(this.node.position,this.node.worldPosition);

        let battleVo = CacheManager.gameGrid.findTarget(this._vo.worldPos, EntityType.Grid);
        if (!battleVo || battleVo.id == this._vo.battleVo.id) return;
        this._vo.battleVo = battleVo;
        this.node.parent.inverseTransformPoint(this._battlePos,battleVo.worldPos);
    }

    protected onEntityVoUpdate() {
        this.node.setPosition(this._vo.pos);
        this._agentPos.x = this._vo.pos.x;
        this._agentPos.y = this._vo.pos.z;
        let sid = Simulator.Instance.addAgent(this._agentPos);
        if (sid >= 0) {
            this.sid = sid;
        }
    }

    private RVOMoving() {
        let sid = this.sid;
        if (sid >= 0) {
            let pos: Vec2 = Simulator.Instance.getAgentPosition(sid);
            let vel: Vec2 = Simulator.Instance.getAgentPrefVelocity(sid);
            this.node.position = new Vec3(pos.x, this.node.position.y, pos.y);
            if (Math.abs(vel.x) > 0.01 && Math.abs(vel.y) > 0.01) {
                this.node.forward = new Vec3(vel.x, 0, vel.y).normalize();
            }
        }

        // if (!Input.GetMouseButton(1))
        // {
        //     Simulator.Instance.setAgentPrefVelocity(sid, new Vec2(0, 0));
        //     return;
        // }
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

        let vel: Vec2 = Simulator.Instance.getAgentPrefVelocity(sid);
        let newVec2 = new Vec2(Math.cos(angle), Math.sin(angle)).multiplyScalar(dist);
        newVec2.x += vel.x;
        newVec2.y += vel.y;
        Simulator.Instance.setAgentPrefVelocity(sid, newVec2);
    }

    protected onDestroy(): void {
        if(this._anim){
            this._anim.destroy();
            this._anim = null;
        }

        if(this._bodyModel){
            this._bodyModel.destroy();
            this._bodyModel = null;
        }
        super.onDestroy();
    }
}