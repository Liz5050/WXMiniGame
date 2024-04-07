import { BoxCollider, Component, Node, ParticleSystem, Tween, Vec3, _decorator, math, tween } from "cc";
import { EntityState, EntityType, EntityVo } from "../../vo/EntityVo";
import { BaseEntity } from "./BaseEntity";
import { CacheManager } from "../../../../manager/CacheManager";
import Mgr from "../../../../manager/Mgr";
import MathUtils from "../../../../utils/MathUtils";
const { ccclass, property } = _decorator;

@ccclass
export class GameGridMapItem extends BaseEntity {
    @property(Node) bodyNode: Node;
    @property(Node) preview: Node;
    @property(Node) rigthNode: Node;
    @property(Node) errorNode: Node;
    @property(BoxCollider) collider: BoxCollider;
    private _col: number;
    private _row: number;
    private _playTween: boolean;
    private _skinRes: string;
    private _isPreview: boolean = false;

    private _battlePos:Vec3;
    private _atkTime:number = 0;
    private _isEmpty:boolean = true;
    public setPos(col: number, row: number) {
        this._col = col;
        this._row = row;
        this.node.setPosition(this._col, 0, this._row);
        this._battlePos = new Vec3();
        this.initMapItem();
    }
    protected updateSub(dt: number): void {
        if(!this._vo || this._vo.isDead()) return;
        if(this._vo.state == EntityState.idle){
            
        }
    }

    private initMapItem() {
        this.bodyNode.active = false;
        this.preview.active = false;
        this.updateItemTexture();
    }

    public onEntityVoUpdate(){
        this._vo.updatePos(this.node.position,this.node.worldPosition);
    }

    protected playNone(): void {
        if (this.bodyNode.active) this.bodyNode.active = false;
        this._vo = null;
        this._isEmpty = true;
        this.collider.node.setPosition(0,-1,0);
    }

    protected playDie(): void {
        this.playNone();
    }

    protected playIdle(): void {
        this.bodyNode.setPosition(0,0,0);
        this.bodyNode.setScale(1,1,1);
        this.bodyNode.setRotationFromEuler(0,0,0);
        if (!this.bodyNode.active) this.bodyNode.active = true;
        if (this.preview.active) this.preview.active = false;
    }

    protected playAttackPre(): void {
        this._atkTime = this._vo.atkTime;
        this.atkEffect1();
    }

    private atkEffect1(){
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

    protected playAttack(): void {
        tween(this.bodyNode)
        .to(this._atkTime / 1000,{position:new Vec3(this._battlePos.x,0,this._battlePos.z),scale:new Vec3(0.05,0.05,0.05)}).delay(0.1)
        .call(()=>{
            if (this.bodyNode.active) this.bodyNode.active = false;
        })
        .start();
    }

    protected playHurt(): void {
        tween(this.bodyNode).to(0.1,{scale:new Vec3(0.2,1.2,0.5)}).to(0.1,{scale:new Vec3(1,1,1)}).start();
    }

    protected onSelectChanged(): void {
        if(this._isSelected){
            this.setEmpty(true,true,true);
        }
    }

    public updateItemTexture() {
        // if(!this._itemSprite) return;
        // let skinCfg = CacheManager.gameGrid.GetCurSkinCfg();
        // if(skinCfg && skinCfg.resName){
        //     if(skinCfg.resName != this._skinRes){
        //         Mgr.loader.SetSpriteByAtlas(this._itemSprite,"animal_square",skinCfg.resName);
        //         this._skinRes = skinCfg.resName;
        //     }
        // }
        // else{
        //     if(this._skinRes != "red_button07"){
        //         Mgr.loader.SetSpriteByAtlas(this._itemSprite,"common_ui","red_button07");
        //         this._skinRes = "red_button07";
        //     }
        // }
    }

    public get isEmpty(): boolean {
        return !this._vo || this._vo.state == EntityState.none || this._vo.state == EntityState.die;
    }

    public setEmpty(bool: boolean, attack: boolean = false, attackEmpty: boolean = false) {
        if(this._isEmpty == bool) return;
        this._isEmpty = bool;
        if (!bool) {
            //非空
            this.setState(EntityState.idle);
            this.collider.node.setPosition(0,0,0);
        }
        else {
            //空
            this.collider.node.setPosition(0,-1,0);
            if(attack){
                if(!this._vo.battleVo || this._vo.battleVo.isDead()){
                    let battleVo = CacheManager.gameGrid.findTarget(this._vo.worldPos,EntityType.Enemy);
                    if(battleVo){
                        this._vo.battleVo = battleVo;
                    }
                }
                if(!this._vo.battleVo || this._vo.battleVo.isDead()){
                    if(attackEmpty){
                        this.setState(EntityState.attackEmpty);
                    }
                    else {
                        this.setState(EntityState.none);
                    }
                }
                else{
                    this.setState(EntityState.attackPre);
                }
            }
            else{
                this.setState(EntityState.die);
            }
            // if(playTween){
            //     if(!this._playTween){
            //         this._playTween = true;
            //         let index:number = 0;
            //         if(col_row > 0){
            //             index = col_row == 1 ? this._row : this._col;
            //         }
            //         TweenManager.addTween(this._itemEntity).wait(50 * index).to({scaleX:2,scaleY:2},50).to({scaleX:0,scaleY:0},100).call(()=>{
            //             this._itemEntity.setScale(1,1);
            //             this._playTween = false;
            //             this._itemEntity.active = false;
            //         });
            //     }
            // }
            // else{
            //     this.clearTween();
            //     this._itemEntity.active = false;
            // }
        }
    }

    public setPreview(isShow: boolean) {
        if (this._isPreview === isShow) return;
        this._isPreview = isShow;
        this.preview.active = isShow;
        let isRight = this.isEmpty;
        this.rigthNode.active = isRight;
        this.errorNode.active = !isRight;
    }

    private clearTween() {
        // if(this._playTween){
        //     TweenManager.removeTweens(this._itemEntity);
        //     this._itemEntity.setScale(1,1);
        //     this._playTween = false;
        // }
    }

    public get col(): number {
        return this._col;
    }

    public get row(): number {
        return this._row;
    }

    public resetEntity(): void {
        Tween.stopAllByTarget(this.bodyNode);
        this.collider.node.setPosition(0,-1,0);
        super.resetEntity();     
    }
}