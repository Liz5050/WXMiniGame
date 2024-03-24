import { Node, Vec3, director, game, math } from "cc";
import Mgr from "../../../manager/Mgr";
import { BaseEntity } from "../scene/entity/BaseEntity";
import { CacheManager } from "../../../manager/CacheManager";

export enum EntityType {
    Grid = 1,
    Enemy = 2,
}
export enum EntityState {
    none = 0,
    idle = 1,
    walk,
    attackPre,//前摇
    attack,//攻击
    attackAfter,//后摇
    stiffness,//硬直
    die,
}

export class EntityVo extends Object{
    protected _id: number = 0;
    protected _speed: number = 0;
    protected _skills: number[];
    protected _hp: number = 0;
    protected _maxHp: number = 0;
    protected _attack: number = 20;//攻击力
    protected _type: number = 0;
    protected _pos: Vec3;
    protected _worldPos: Vec3;
    protected _attackDistance: number = 1;//攻击距离
    protected _stiffnessTime: number = 0;//硬直时间
    private _attackTime: number = 0;//攻击的时间，用于计算攻击CD
    protected _attackCD: number = 1000;//ms攻击CD时间（攻速）
    protected _atkPreTime: number = 0;//前摇时长 单位ms
    protected _atkTime: number = 100;//攻击时长 单位ms
    protected _atkAfterTime: number = 0;//后摇时长 单位ms

    protected _state: EntityState;
    protected _defaultState: EntityState;
    protected _battleVo: EntityVo;
    protected _entity: BaseEntity;
    public initVo(data?: any) {
        if (data) {
            for (let key in data) {
                this[`_${key}`] = data[key];
            }
        }
        this._pos = new Vec3();
        this._worldPos = new Vec3();
        console.log("创建实体 type:" + this.type + "--------x:" + this._pos.x + ",y:" + this._pos.y);
        this._defaultState = EntityState.idle;
        this._state = EntityState.idle;
        this.init();
    }

    protected init() {}
    protected playNone() { }
    protected playIdle() { }
    protected playWalk() { }
    protected moving() { }
    protected playAttackPre() { }
    protected playAttack() { }
    protected playAttackAfter() { }
    protected playStiffness() { }
    protected playDie() { }
    protected playHurt() { }
    protected stopMove() { }

    public setEntity(entity: BaseEntity) {
        this._entity = entity;
    }

    public setState(state: EntityState) {
        if (this._state == state) return false;
        if (!this.checkState(state)) return false;
        // console.log("设置状态:" + EntityState[state]);
        if (state == EntityState.attackPre && this._atkPreTime <= 0) {
            //无前摇，攻击直接生效
            return this.setState(EntityState.attack);
        }
        if (state == EntityState.attackAfter && this._atkAfterTime <= 0) {
            //无后摇，直接进入默认状态
            return this.setState(this._defaultState);
        }
        if(state == EntityState.stiffness && this._stiffnessTime <= 0){
            this.playHurt();
            return false;
        }
        switch (state) {
            case EntityState.none:
                this.onNone();
                break;
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
                this.onAttackAfter();
                break;
            case EntityState.stiffness:
                this.onStiffness();
                break;
            case EntityState.die:
                this.onDie();
                break;
        }
        this.onStateChanged(state);
        this._state = state;
        return true;
    }

    private onStateChanged(state: EntityState) {
        if (this._entity) this._entity.onStateChanged(state);
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
        let dis = math.Vec3.distance(this._battleVo.worldPos, this.worldPos);
        return dis <= this._attackDistance;
    }

    public isAttacking() {
        return this._state == EntityState.attackPre || this._state == EntityState.attack || this._state == EntityState.attackAfter;
    }

    private onNone(){
        this.playNone();
        this.clear();
    }

    private onIdle() {
        this.playIdle();
    };

    private onWalk() {
        this.playWalk();
    };

    private onAttackPre() {
        this._attackTime = game.totalTime;
        Mgr.timer.doDelay(this._atkPreTime, () => {
            this.setState(EntityState.attack);
        }, this);
        this.playAttackPre();
    }

    private onAttack() {
        // console.log("实施攻击中");
        Mgr.timer.doDelay(this._atkTime, () => {
            this.setState(EntityState.attackAfter);
            this.playAttack();
            // console.log("攻击结束：" + (game.totalTime - time));
        }, this);
    };

    private onAttackAfter() {
        Mgr.timer.doDelay(this._atkAfterTime, () => {
            this.setState(this._defaultState);
        }, this);
        this.playAttackAfter();
    }

    private onStiffness() {
        Mgr.timer.doDelay(this._stiffnessTime, () => {
            this.setState(this._defaultState);
        }, this);
        this.playStiffness();
    };

    private onDie() {
        this.playDie();
        this.clear();
    };

    public updatePos(pos: Vec3,worldPosition:Vec3) {
        this._pos.x = pos.x;
        this._pos.z = pos.z;
        this._worldPos.x = worldPosition.x;
        this._worldPos.y = worldPosition.y;
        this._worldPos.z = worldPosition.z;
    }

    public death() {
        this.setState(EntityState.die);
    }

    public isDead(): boolean {
        return this._hp <= 0 || this._state == EntityState.die;
    }

    public clear(){
        // CacheManager.gameGrid.delEntity(this.id);
        // Mgr.timer.removeAll(this);
    }

    public set battleVo(vo: EntityVo) {
        this._battleVo = vo;
    }

    public get battleVo(): EntityVo {
        return this._battleVo;
    }
    public get hp(): number {
        return this._hp;
    }
    public set hp(val: number) {
        if(this._hp <= 0 && val <= 0) return;
        if (this._hp > 0) {
            if(val <= 0) this.setState(EntityState.die);
            else this.setState(EntityState.stiffness);
        }
        
        this._hp = val;
        if (this._entity) this._entity.updateHp();
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
    public get worldPos(){
        return this._worldPos;
    }
    public get atkPretime():number{
        return this._atkPreTime;
    }
    public get atkTime():number{
        return this._atkTime;
    }
}