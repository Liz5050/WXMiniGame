import { Node, Vec3, director, game, math } from "cc";
import MathUtils from "../../../utils/MathUtils";
import Mgr from "../../../manager/Mgr";
import { BaseEntity } from "../scene/entity/BaseEntity";

export enum EntityType {
    Grid = 1,
    Enemy = 2,
}
export enum EntityState {
    idle = 1,
    walk,
    attackPre,//前摇
    attack,//攻击
    attackAfter,//后摇
    stiffness,//硬直
    die,
}

export class EntityVo {
    protected _id: number = 0;
    protected _speed: number = 0;
    protected _skills: number[];
    protected _hp: number = 0;
    protected _maxHp: number = 0;
    protected _attack: number = 20;//攻击力
    protected _type: number = 0;
    protected _pos: Vec3;
    private _state: EntityState;
    private _stiffness: number = 1000;
    private _attackDistance: number = 1;//攻击距离
    private _attackTime: number = 0;//攻击的时间，用于计算攻击CD
    private _attackCD: number = 1000;//ms
    private _atkPretime: number = 400;//前摇时长 单位ms
    private _atkTime: number = 133;//攻击时长 单位ms
    private _atkAfterTime: number = 266;//后摇时长 单位ms

    private _battleVo: EntityVo;
    private _entity: BaseEntity;
    public initVo(data: any) {
        for (let key in data) {
            this[`_${key}`] = data[key];
        }
        this._pos = new Vec3();
        if (this._type == EntityType.Enemy) {
            this._pos.x = MathUtils.getRandom(0, 9);
            this._pos.z = MathUtils.getRandom(0, 5);
        }
        console.log("创建实体 type:" + this.type + "--------x:" + this._pos.x + ",y:" + this._pos.y);
        this._state = EntityState.idle;
    }

    public setEntity(entity: BaseEntity) {
        this._entity = entity;
    }

    public setState(state: EntityState) {
        if (this._state == state) return false;
        if (!this.checkState(state)) return false;
        // console.log("设置状态:" + EntityState[state]);
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
                // console.log("攻击后摇");
                Mgr.timer.doDelay(this._atkAfterTime, () => {
                    this.setState(EntityState.idle);
                }, this);
                break;
            case EntityState.stiffness:
                this.onStiffness();
                break;
            case EntityState.die:
                this.onDie();
                break;
        }
        this._state = state;
        return true;
    }

    private checkState(state: EntityState): boolean {
        switch (state) {
            case EntityState.idle:
                break;
            case EntityState.walk:
                break;
            case EntityState.attackPre:
                return this.canAttack();
            case EntityState.attack:
                break;
            case EntityState.attackAfter:
                break;
            case EntityState.stiffness:
                break;
            case EntityState.die:
                break;
        }
        return true;
    }

    public canAttack(): boolean {
        if (!this.battleVo || this.battleVo.isDead()) return false;
        let time = game.totalTime - this._attackTime;
        if (time >= this._attackCD) {
            return this.isAttackRange();
        }
        return false;
    }

    public isAttackRange(): boolean {
        let dis = math.Vec3.distance(this._battleVo.pos, this.pos);
        return dis <= this._attackDistance;
    }

    public isAttacking() {
        return this._state == EntityState.attackPre || this._state == EntityState.attack || this._state == EntityState.attackAfter;
    }

    public set battleVo(vo: EntityVo) {
        this._battleVo = vo;
    }

    public get battleVo(): EntityVo {
        return this._battleVo;
    }
    public get state(): number {
        return this._state;
    }
    public get id(): number {
        return this._id;
    }
    public get speed(): number {
        return this._speed;
    }
    public get hp(): number {
        return this._hp;
    }
    public set hp(val: number) {
        if (this._hp > 0 && this._entity) {
            this._entity.hurt();
        }
        this._hp = val;
        if(this._entity) this._entity.updateHp();
        if (this._hp <= 0) this.death();
    }
    public get maxHp(): number {
        return this._maxHp;
    }
    public get attack(): number {
        return this._attack;
    }
    public get type(): number {
        return this._type
    }
    public get pos(): Vec3 {
        return this._pos;
    }

    private onIdle() {
        this.playIdle();
    };
    private onWalk() {
        this.playWalk();
    };
    private onAttackPre() {
        this._attackTime = game.totalTime;
        Mgr.timer.doDelay(this._atkPretime, () => {
            this.setState(EntityState.attack);
        }, this);
        this.playAttackPre();
    }
    private onAttack() {
        // console.log("实施攻击中");
        Mgr.timer.doDelay(this._atkTime, () => {
            this.setState(EntityState.attackAfter);
            // console.log("攻击结束：" + (game.totalTime - time));
        }, this);
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

    public updatePos(pos: Vec3) {
        this._pos.x = pos.x;
        this._pos.z = pos.z;
    }

    public getBattleDistance() {
        if (!this._battleVo || this._battleVo.isDead()) return -1;
        return math.Vec3.distance(this._battleVo.pos, this.pos);
    }

    public death() {
        if (this._entity) {
            this._entity.setStateFromVo(EntityState.die);
        }
        else {
            this.setState(EntityState.die);
        }
    }

    public isDead(): boolean {
        return this._hp <= 0 || this._state == EntityState.die;
    }
}