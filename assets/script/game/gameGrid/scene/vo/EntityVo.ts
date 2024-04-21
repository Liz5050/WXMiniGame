import { Node, Vec3, director, game, math } from "cc";
import Mgr from "../../../../manager/Mgr";
import { BaseEntity } from "../entity/BaseEntity";
import { CacheManager } from "../../../../manager/CacheManager";
import MathUtils from "../../../../utils/MathUtils";
import { EventManager } from "../../../../manager/EventManager";
import { EventEnum } from "../../../../enum/EventEnum";
import { EntityState } from "../utils/EntityUtil";

export class EntityVo extends Object{
    protected _id: number = 0;
    protected _name:string = "";
    protected _speed: number = 0;
    protected _skills: number[];
    protected _exp:number = 0;
    public maxExp:number = 10;
    public level:number = 1;
    protected _hp: number = 0;
    protected _maxHp: number = 0;
    protected _attack: number = 20;//攻击力
    protected _type: number = 0;
    protected _pos: Vec3;
    protected _worldPos: Vec3;
    protected _attackDistance: number = 1;//攻击距离
    protected _stiffnessTime: number = 0;//硬直时间
    protected _dieTime:number = 0;//死亡消亡时间
    private _attackTime: number = 0;//攻击的时间，用于计算攻击CD
    protected _attackCD: number = 1000;//ms攻击CD时间（攻速）
    protected _atkPreTime: number = 0;//前摇时长 单位ms
    protected _atkTime: number = 100;//攻击时长 单位ms
    protected _atkAfterTime: number = 0;//后摇时长 单位ms

    protected _state: EntityState;
    protected _defaultState: EntityState;
    protected _battleVo: EntityVo;
    protected _entity: BaseEntity;
    private _isDel:boolean = false;
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
    protected stopMove() { }
    private playHurt() { 
        this._entity && this._entity.hurt();
    }

    public setEntity(entity: BaseEntity) {
        this._entity = entity;
    }

    public get entity():BaseEntity{
        return this._entity;
    }

    public get isSelected(){
        return this._entity && this._entity.isSelected;
    }

    public setState(state: EntityState) {
        if(this._isDel) return;
        if (this._state == state) return false;
        if (!this.checkState(state)) return false;
        // console.log("设置状态:" + EntityState[state]);
        if ((state == EntityState.attackPre || state == EntityState.attackEmpty) && this._atkPreTime <= 0) {
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
            case EntityState.attackEmpty:
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
        if(this._state == EntityState.die) return false;
        switch (state) {
            case EntityState.idle:
                break;
            case EntityState.walk:
                break;
            case EntityState.attackEmpty:
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

    public set exp(val:number){
        this._exp = val;
    }

    public addExp(val:number){
        let exp = this._exp + val;
        if(exp >= this.maxExp){
            this._exp = this.maxExp - exp;
            this.levelUp();
            console.log("addexp:"+this._exp + "---maxExp" + this.maxExp)
        }
        else{
            this._exp = exp;
        }
    }

    private levelUp(){
        this.level ++;
        this._attack += 10;
        this._maxHp = 100 + this.level * 10;
        this.maxExp = Math.min(this.level * 10,80);
        this.hp = this._maxHp;
        this.entity && this.entity.updateLevel();
    }

    private canAttack(): boolean {
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
        return this._state == EntityState.attackPre || this._state == EntityState.attack || this._state == EntityState.attackAfter || this._state == EntityState.attackEmpty;
    }

    private onNone(){
        this.clear();
        this.playNone();
    }

    private onIdle() {
        this.playIdle();
    };

    private onWalk() {
        this.playWalk();
    };

    private onAttackPre() {
        this._attackTime = game.totalTime;
        Mgr.timer2.doOnce(this._atkPreTime,()=>{
            this.setState(EntityState.attack);
        });
        // Mgr.timer.doDelay(this._atkPreTime, () => {
        //     this.setState(EntityState.attack);
        // }, this);
        this.playAttackPre();
    }

    private onAttack() {
        // console.log("实施攻击中");
        Mgr.timer.doDelay(this._atkTime, () => {
            this.setState(EntityState.attackAfter);
            // console.log("攻击结束：" + (game.totalTime - time));
            if (!this.battleVo) return;
            this.battleVo.hp -= this._attack;
            if(this.battleVo.isDead()) {
                this.battleVo = null;
            }
        },this);
    };

    private onAttackAfter() {
        Mgr.timer.doDelay(this._atkAfterTime, () => {
            this.setState(this._defaultState);
        },this);
        this.playAttackAfter();
    }

    private onStiffness() {
        Mgr.timer.doDelay(this._stiffnessTime, () => {
            this.setState(this._defaultState);
        },this);
        this.playStiffness();
    };

    private onDie() {
        if(this._dieTime > 0){
            Mgr.timer.doDelay(this._dieTime, ()=>{
                this.death();
            },this);
        }
        else{
            this.death();
        }
        this.playDie();
    };

    public updatePos(pos: Vec3,worldPosition:Vec3) {
        this._pos.x = pos.x;
        this._pos.z = pos.z;
        this._worldPos.x = worldPosition.x;
        this._worldPos.y = worldPosition.y;
        this._worldPos.z = worldPosition.z;
    }

    public getNextSkillId():number{
        let skillList = this._skills;
        if(!skillList || skillList.length == 0) return 1;
        return skillList[0];
    }

    private death() {
        this.clear();
    }

    public isDead(): boolean {
        return this._hp <= 0 || this._state == EntityState.die;
    }

    public clear(){
        this._isDel = true;
        this._hp = 0;
        if (this.battleVo && this.battleVo.isDead()) {
            this.battleVo = null;
        }
        EventManager.dispatch(EventEnum.OnSetSelectEntity,this._entity,false);
        CacheManager.gameGrid.delEntity(this.entityId);
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
        let isHurt = val < this._hp;
        this._hp = val;
        if(isHurt) {
            this.playHurt();
            if(val <= 0) this.setState(EntityState.die);
            else this.setState(EntityState.stiffness);
        }
        else{
            this.entity && this.entity.updateHp();
        }
    }
    public get state(): number {
        return this._state;
    }
    public get name():string{
        return this._name;
    }
    public getShowName():string{
        return this.name;
    }
    public get id(): number {
        return this._id;
    }
    public get skills():number[]{
        return this._skills;
    }
    public get entityId():string {
        return this._type + "_" + this._id;
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
    public get stiffnessTime():number{
        return this._stiffnessTime;
    }
    public get dieTime():number{
        return this._dieTime;
    }
}