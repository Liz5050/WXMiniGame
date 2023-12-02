import { math, EventTouch, instantiate, NodeEventType, Button, _decorator, Node,Prefab,UITransform } from 'cc';
import TweenManager from '../../../common/TweenManager';
import { BallItem } from './BallItem';
import MathUtils from '../../../utils/MathUtils';
import { EventManager } from '../../../manager/EventManager';
import { EventEnum } from '../../../enum/EventEnum';
import { Enemy } from './Enemy';
import Mgr from '../../../manager/Mgr';
import { CacheManager } from '../../../manager/CacheManager';
import { GameType } from '../../../enum/GameType';
import { BaseUIView } from '../../base/BaseUIView';
import { UIModuleEnum } from '../../../enum/UIDefine';

export class GameBallView extends BaseUIView {
    private _btnBack:Node;
    private _btnExit:Node;
    private _container:Node;
    private _enemyContainer:Node;
    private _ballTouchArea:Node;
    private _imgArrow:Node;
    private _imgArrowTf:UITransform;
    
    private _startPos:math.Vec3;
    private _endPos:math.Vec3;
    private _showEndY:number;
    private _evtTouchStart:math.Vec3;

    private _beginShoot:boolean = false;
    private _shooting:boolean = false;
    private _balls:Node[] = [];
    private _enemyList:{};
    private _timeOut:any;
    public static Ball_Pools:Node[] = [];
    public static Enemy_Pools:Node[] = [];
    public constructor(){
        super(UIModuleEnum.gameBall,"GameBallView");
    }

    protected initUI(): void {
        let self = this;
        this._enemyList = {};
        this._container = this.getChildByName("container");
        this._enemyContainer = this._container.getChildByName("enemys");
        this._ballTouchArea = this._container.getChildByName("touchArea");
        this._imgArrow = this._ballTouchArea.getChildByName("imgArrow");
        this._imgArrowTf = this._imgArrow.getComponent(UITransform);
        this._imgArrow.active = false;
        this._startPos = new math.Vec3();
        this._endPos = new math.Vec3();
        this._evtTouchStart = new math.Vec3();
        this._ballTouchArea.on(NodeEventType.TOUCH_START,function(evt:EventTouch){
            let startPos = evt.getUIStartLocation(); 
            self.touchStart(startPos);
        })
    
        this._ballTouchArea.on(NodeEventType.TOUCH_CANCEL,function(){
            self.touchEnd();
        });
    
        this._ballTouchArea.on(NodeEventType.TOUCH_END,function(){
            self.touchEnd();
        });
    
        this._ballTouchArea.on(NodeEventType.TOUCH_MOVE,function(event:EventTouch){
            let pos = event.getUIDelta();
            self.touchMove(pos.x,pos.y);
        });
    
        this._btnBack = this.getChildByName("btnBack");
        this._btnBack.active = false;
        this._btnBack.on(Button.EventType.CLICK,()=>{
            this._btnBack.active = false;
            this.resetBalls();
        });
    
        this._btnExit = this.getChildByName("btnExit");
        this._btnExit.on(Button.EventType.CLICK,function(){
            self.hide();
        });
    }

    protected initEvent(): void {
        EventManager.addListener(EventEnum.OnGameBallReset,this.onGameBallReset,this);
        EventManager.addListener(EventEnum.OnEnemyReset,this.onEnemyReset,this);
        EventManager.addListener(EventEnum.OnEnemyRoundComplete,this.checkNextRound,this);
    }

    public onShowAfter() {
        this.nextRound();
        // director.gameRate = 2;
    }

    private touchStart(pos){
        if(this._beginShoot || this._shooting) return;
        this._beginShoot = true;
        this._evtTouchStart.x = pos.x;
        this._evtTouchStart.y = pos.y;
        
        this._ballTouchArea.inverseTransformPoint(this._startPos,this._evtTouchStart);
        this._endPos.x = this._startPos.x;
        this._endPos.y = this._startPos.y;
        
        this._imgArrow.active = true;
        this._imgArrow.setRotationFromEuler(0,0,0);
        this._imgArrowTf.setContentSize(10,10);
        this._imgArrow.setPosition(this._startPos.x,this._startPos.y);
    }

    private touchEnd(){
        if(!this._beginShoot) return;
        this._beginShoot = false;
        this._imgArrow.active = false;
        this._endPos.y = this._showEndY;
        if(this._endPos.x == this._startPos.x && this._endPos.y == this._startPos.y){
            this._endPos.x = 0;
            this._endPos.y = 1;
        }
        else {
            this._endPos.subtract(this._startPos);
        }
        this.shoot();
    }

    private touchMove(deltaX:number,deltaY:number){
        if(this._beginShoot){
            let endX = this._endPos.x + deltaX;
            let endY = this._endPos.y + deltaY;
            this._endPos.x = endX;
            this._endPos.y = endY;

            let showEndY = endY;
            if(showEndY <= this._startPos.y + 100){
                showEndY = this._startPos.y + 100;
            }
            this._showEndY = showEndY;
            let dis = MathUtils.getDistance(this._startPos.x,this._startPos.y,endX,showEndY);
            this._imgArrowTf.setContentSize(28,dis);

            let angle = MathUtils.getAngle2(this._startPos.x,this._startPos.y,endX,showEndY) - 90;
            this._imgArrow.setRotationFromEuler(0,0,angle);
            if(endY < this._startPos.y - 300){
                this.cancelShoot();
            }
        }
    }

    private checkNextRound(){
        for(let id in this._enemyList){
            let info = this._enemyList[id];
            if(info.y == 0 || info.executeRound){
                return;
            }
        }
        this._shooting = false;
        this.nextRound();
    }

    private nextRound(){
        Mgr.soundMgr.play("create_enemy");
        let roundData = CacheManager.gameBall.getCurRoundData();
        let enemys = roundData.enemys;
        for(let i = 0; i < enemys.length; i++){
            let enemyInfo = enemys[i];
            let enemy = this.getEnemy();
            enemy.name = "enemy" + enemyInfo.id;
            enemyInfo.node = enemy;
            enemy.getComponent(Enemy).setData(enemyInfo);
            this._enemyList[enemyInfo.id] = enemyInfo;
        }
        this._btnExit.active = true;
    }

    private onEnemyReset(id:number){
        let node = this._enemyList[id].node;
        delete this._enemyList[id];
        GameBallView.Enemy_Pools.push(node);
    }

    private onGameBallReset(node:Node){
        if(node && node.isValid) {
            let idx = this._balls.indexOf(node);
            if(idx >= 0){
                this._balls.splice(idx,1);
            }
            if(this._balls.length == 0){
                this.changeRound();
                // this._shooting = false;
                this._btnBack.active = false;
            }
            GameBallView.Ball_Pools.push(node);
        }
    }

    private changeRound(){
        for(let id in this._enemyList){
            let info = this._enemyList[id];
            let node = info.node;
            info.executeRound = true;
            node.getComponent(Enemy).executeRound();
        }
    }

    private cancelShoot(){
        this._beginShoot = false;
        this._imgArrow.active = false;
    }

    private resetBalls(){
        if(!this._shooting) return;
        for(let i = 0; i < this._balls.length; i++){
            let ballNode = this._balls[i];
            TweenManager.removeTweens(ballNode);
            let item = ballNode.getComponent(BallItem);
            item.gotoPoint(0,-200);
        }
    }

    private shoot(){
        if(this._shooting) return;
        this._shooting = true;
        this._btnExit.active = false;
        let ballList = CacheManager.gameBall.getBallList();
        let showAllDelay:number = 0;
        for(let i = 0 ; i < ballList.length; i++){
            let ball = this.getBall();
            let item = ball.getComponent(BallItem);
            item.setData(ballList[i]);
            showAllDelay = item.show(i,this._startPos,this._endPos);
            this._balls.push(ball);
        }

        if(this._timeOut){
            clearTimeout(this._timeOut);
        }
        this._timeOut = setTimeout(()=>{
            this._btnBack.active = true;
        },showAllDelay);
    }

    public hide(){
        super.hide();
        if(this._timeOut){
            clearTimeout(this._timeOut);
            this._timeOut = null;
        }
        // this.uploadScore();//上传成绩
        // this.exitClear();
        for(let id in this._enemyList){
            let info = this._enemyList[id];
            info.node.getComponent(Enemy).onlyClear();
            GameBallView.Enemy_Pools.push(info.node);
        }
        this._shooting = false;
        this._beginShoot = false;
        this._enemyList = {};
        this._balls = [];
        this._btnExit.active = true;
        this._btnBack.active = false;
        EventManager.dispatch(EventEnum.OnGameExit,GameType.GameBall);
    }

    private getBall():Node{
        let node = GameBallView.Ball_Pools.pop();
        if(!node){
            let prefabAsset:Prefab = Mgr.loader.getBundleRes("ui","gameBall/BallItem") as Prefab;
            if(prefabAsset){
                node = instantiate(prefabAsset);
                this._ballTouchArea.addChild(node);
                node.active = false;
            }
            else{
                console.log("找不到资源gameBall/BallItem");
            }
            // instantiate(this._PrefabBall);
        }
        node.getComponent(BallItem)
        return node;
    }

    private getEnemy():Node{
        let node = GameBallView.Enemy_Pools.shift();
        if(!node){
            let prefabAsset:Prefab = Mgr.loader.getBundleRes("ui","gameBall/Enemy") as Prefab;
            if(prefabAsset){
                node = instantiate(prefabAsset);
                // node.setParent(this._enemyContainer);
                this._enemyContainer.addChild(node);
                node.active = false;
            }
            else{
                console.log("找不到资源gameBall/Enemy");
            }
        }
        return node;
    }
}


