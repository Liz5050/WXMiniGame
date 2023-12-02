import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('PropRefreshAnimition')
export class PropRefreshAnimition extends Component {
    start() {

    }

    update(deltaTime: number) {
        
    }

    public OnAnimationComplete(){
        this.node.active = false;
    }
}


