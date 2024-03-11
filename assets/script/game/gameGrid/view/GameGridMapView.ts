import { BoxCollider, Component, Graphics, Line, Node, PhysicsSystem, Prefab, Vec3, _decorator, game, geometry, instantiate, screen } from "cc";
import { CacheManager } from "../../../manager/CacheManager";
import Mgr from "../../../manager/Mgr";
import { Root3D } from "../../../Root3D";
import { EventManager } from "../../../manager/EventManager";
import { EventEnum } from "../../../enum/EventEnum";
import MathUtils from "../../../utils/MathUtils";
const { ccclass, property } = _decorator;

@ccclass('GameGridMapView')
export class GameGridMapView extends Component{
    private static GridPool:Node[] = [];
    @property(Node) mapGrid:Node = null;
    @property(Node) mapGridContainer:Node = null;
    @property(Node) tempGroup:Node = null;
    @property(BoxCollider) posTrigger:BoxCollider = null;
    private _gridPrefab:Prefab;
    private _ray: geometry.Ray;
    private _groupPos:Vec3;
    
    protected onLoad(): void {
        this._ray = new geometry.Ray();
        this._groupPos = new Vec3();
        EventManager.addListener(EventEnum.OnGameSceneGridMove,this.onGridMove,this);
    }

    public createPreviewGrid(resType:number,startX:number,startY:number){
        let camera = Root3D.mainCamera;
        camera.screenPointToRay(startX, startY, this._ray);
        if (PhysicsSystem.instance.raycast(this._ray)) {
            const raycastResults = PhysicsSystem.instance.raycastResults;
            for (let i = 0; i < raycastResults.length; i++) {
                const item = raycastResults[i];
                if (item.collider == this.posTrigger) {
                    this.mapGridContainer.inverseTransformPoint(this._groupPos,item.hitPoint);
                    this._groupPos.z -= 2;
                    this.tempGroup.position = this._groupPos;
                    break;
                }
            }
        }

        let dataList = CacheManager.gameGrid.getGridDataList(resType);
        let rowNum = dataList.length;
        for(let row = 0; row < rowNum; row++){
            let rowList = dataList[row];
            let colNum = rowList.length;
            //偶数：起始点偏移0.5，奇数：起始点为原点(目的是让初始位置，相对点击位置保持相对居中)
            // let offsetX:number = colNum % 2 == 0 ? -0.5 : 0;
            // let offsetZ:number = rowNum % 2 == 0 ? -0.5 : 0;
            let startX = -(colNum - 1) / 2;
            let startZ = -(rowNum - 1) / 2;
            for(let col = 0; col < colNum; col++){
                let isShow = dataList[row][col] == 1;
                let posX = col * 1 + startX;
                let posZ = row * 1 + startZ;
                if(isShow){
                    let gridNode = this.getGridNode();
                    gridNode.setPosition(posX,0,posZ);
                }
            }
        }
    }

    private getGridNode():Node{
        if(!this._gridPrefab){
            let prefab = Mgr.loader.getBundleRes("scene","GameGrid3D/RedGrid") as Prefab;
            if(!prefab){
                console.warn("RedGrid资源未加载");
                return null;
            }
            this._gridPrefab = prefab;
        }
        let gridNode = GameGridMapView.GridPool.pop();
        if(!gridNode){
            gridNode = instantiate(this._gridPrefab);
        }
        this.tempGroup.addChild(gridNode);
        return gridNode;
    }

    private onGridMove(touchX:number,touchY:number){
        let camera = Root3D.mainCamera;
        camera.screenPointToRay(touchX, touchY, this._ray);
        if (PhysicsSystem.instance.raycast(this._ray)) {
            const raycastResults = PhysicsSystem.instance.raycastResults;
            for (let i = 0; i < raycastResults.length; i++) {
                const item = raycastResults[i];
                if (item.collider == this.posTrigger) {
                    this.mapGridContainer.inverseTransformPoint(this._groupPos,item.hitPoint);
                    // this._groupPos.x -= 2;
                    this._groupPos.z -= 2;
                    this.tempGroup.position = this._groupPos;
                    break;
                }
            }
        }
    }

    private _dropPos:Vec3 = new Vec3();
    public onGridDrop(isRight:boolean){
        let tempNodeList = this.tempGroup.children;
        let len = tempNodeList.length;
        if(tempNodeList.length > 0){
            for(let i = len - 1; i >= 0; i-- ){
                let node = tempNodeList[i];
                if(isRight){
                    this.mapGridContainer.inverseTransformPoint(this._dropPos,node.worldPosition);
                    this.mapGridContainer.addChild(node);
                    node.position = this._dropPos;
                }
                else{
                    node.removeFromParent();
                    GameGridMapView.GridPool.push(node);
                }
            }
        }
    }
}