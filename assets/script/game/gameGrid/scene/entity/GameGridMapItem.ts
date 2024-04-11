import { BoxCollider, Component, Node, ParticleSystem, Tween, Vec3, _decorator, math, tween, easing } from "cc";
import { EntityState, EntityType, EntityVo } from "../../vo/EntityVo";
import { BaseEntity } from "./BaseEntity";
import { CacheManager } from "../../../../manager/CacheManager";
import Mgr from "../../../../manager/Mgr";
import MathUtils from "../../../../utils/MathUtils";
import { SkillComponent } from "../components/SkillComponent";
const { ccclass, property } = _decorator;

@ccclass
export class GameGridMapItem extends BaseEntity {
    @property(Node) bodyNode: Node = null;
    @property(Node) preview: Node = null;
    @property(Node) rigthNode: Node = null;
    @property(Node) errorNode: Node = null;
    @property(BoxCollider) collider: BoxCollider = null;
    @property(SkillComponent) skill:SkillComponent = null;
    private _col: number;
    private _row: number;
    private _playTween: boolean;
    private _skinRes: string;
    private _isPreview: boolean = false;

    private _isEmpty:boolean = true;
    public setPos(col: number, row: number) {
        this._col = col;
        this._row = row;
        this.node.setPosition(this._col, 0, this._row);
        this.initMapItem();
    }
    protected updateSub(dt: number): void {
        if(!this._vo || this._vo.isDead()) return;
        if(this._vo.type != EntityType.GridHero) return;
        if(!CacheManager.gameGrid.isBattle()) {
            this.setState(EntityState.idle);
            return;
        }
        if (this._vo.state == EntityState.idle) {
            if (!this._vo.battleVo || this._vo.battleVo.isDead()) {
                let battleVo = CacheManager.gameGrid.findTarget(this._vo.worldPos, EntityType.Enemy);
                if (!battleVo) return;
                this._vo.battleVo = battleVo;
            }
            if (this._vo.isAttackRange()) {
                this.setState(EntityState.attackPre);
                // this.setState(EntityState.idle);
            }
        }
    }

    private initMapItem() {
        this.bodyNode.active = false;
        this.preview.active = false;
        this.updateItemTexture();
    }

    public onEntityVoUpdate(){
        this._vo.updatePos(this.node.position,this.node.worldPosition);
        this.skill.setData(this._vo);
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
        Tween.stopAllByTarget(this.bodyNode);
        this.bodyNode.setPosition(0,0,0);
        this.bodyNode.setScale(1,1,1);
        this.bodyNode.setRotationFromEuler(0,0,0);
        if (!this.bodyNode.active) this.bodyNode.active = true;
        if (this.preview.active) this.preview.active = false;
    }

    protected playAttackPre(): void {
        this.skill.playPre();
        // this.skill.playSkill(1,"pre");
    }

    protected playAttack(): void {
        // this.skill.playSkill(1,"atk");
        this.skill.playAttack();
    }

    protected playHurt(): void {
        tween(this.bodyNode).to(0.1,{scale:new Vec3(0.2,1.2,0.5)}).to(0.1,{scale:new Vec3(1,1,1)}).start();
    }

    protected onSelectChanged(): void {
        if(this._isSelected && this._vo && this._vo.type == EntityType.Grid){
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

    public gotoHero(pos,col_row){
        let index:number = 0;
        let endX:number = 0;
        let endZ:number = 0;
        if(col_row > 0){
            if(col_row == 1){
                index = this._row;
                endZ = pos.z;
            }
            else{
                index = this._col;
                endX = pos.x - this._col;
            }
        }
        let delay = 0.1 * index;
        // let endPos = this.node.inverseTransformPoint(new Vec3(),pos);
        // endPos.y = 0;
        // endPos.z = 0;
        tween(this.bodyNode).delay(delay).to(0.2,{position:new Vec3(endX,0,endZ)},{easing:easing.backIn})
        .to(0.5,{scale:new Vec3(2,2,2)}).to(0.5,{scale:new Vec3(0,0,0)}).call(()=>{
            this.setEmpty(false);
        })
        .start();
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
        this._isSelected = false;
        this._vo = null;
        // super.resetEntity();     
    }
}