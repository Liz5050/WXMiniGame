import { _decorator, Component, EventTouch, Label, math, NodeEventType } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('GameNumberItem')
export class GameNumberItem extends Component {
    private _txtNumber:Label;
    
    start() {
        this.initUI();
    }

    update(deltaTime: number) {
        
    }

    private initUI(){
        let self = this;
        let startPos = this.node.getPosition();
        this._txtNumber = this.node.getChildByName("txtNum").getComponent(Label);
        // this.node.on(NodeEventType.TOUCH_START,function(evt:EventTouch){
        //     let pos = evt.getUIStartLocation();
        //     startPos1.x = pos.x;
        //     startPos1.y = pos.y;
        //     self.node.parent.inverseTransformPoint(startPos2,startPos1);
        // });
        this.node.on(NodeEventType.TOUCH_MOVE,function(evt:EventTouch){
            let deltaPos = evt.getUIDelta();
            let moveX = startPos.x + deltaPos.x;
            let moveY = startPos.y + deltaPos.y;
            startPos.x = moveX;
            startPos.y = moveY;
            self.node.setPosition(moveX,moveY);
        });
    }
}


