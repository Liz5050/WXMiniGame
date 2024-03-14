import { BoxCollider, Component, Graphics, Line, Node, PhysicsSystem, Prefab, Vec3, _decorator, game, geometry, instantiate, screen } from "cc";
import { CacheManager } from "../../../manager/CacheManager";
import Mgr from "../../../manager/Mgr";
import { Root3D } from "../../../Root3D";
import { EventManager } from "../../../manager/EventManager";
import { EventEnum } from "../../../enum/EventEnum";
import MathUtils from "../../../utils/MathUtils";
import { GameGridMapItem } from "./item/GameGridMapItem";
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
    private _mapItemList:GameGridMapItem[][];
    protected onLoad(): void {
        this._ray = new geometry.Ray();
        this._groupPos = new Vec3();
        EventManager.addListener(EventEnum.OnGameSceneGridMove,this.onGridMove,this);
        this.initMapGrid();
    }

    private initMapGrid(){
        this._mapItemList = [];
        for(let row = 0; row < 10; row++){
            for(let col = 0; col < 10; col++){
                if(!this._mapItemList[row]){
                    this._mapItemList[row] = [];
                }
                let item:GameGridMapItem = new GameGridMapItem();
                this._mapItemList[row][col] = item;
                item.init(col,row,this.mapGridContainer);
            }
        }
    }

    private _endCheckLocalPos:Vec3 = new Vec3();
    private OnTouchEndCheck():{isRight:boolean,canRemove:boolean,totalNum:number}{
        let tempNodeList = this.tempGroup.children;
        let num = tempNodeList.length;
        let emptyNum = 0;
        let itemArr:GameGridMapItem[] = [];
        for(let i = 0; i < num; i ++) {
            let grid:Node = tempNodeList[i];//GameUI.FindChild(randomGrid,"grid" + i);
            this.mapGridContainer.inverseTransformPoint(this._endCheckLocalPos,grid.worldPosition);
            // console.log("坐标转换" + i + "----x：" + localPos.x + "----y：" + localPos.y)
            if(this._endCheckLocalPos.x >= -0.5 && this._endCheckLocalPos.x <= 9.5 && this._endCheckLocalPos.z >= -0.5 && this._endCheckLocalPos.z <= 9.5){
                //在范围内，进一步检测对应网格是否是空位
                let centerX = Math.round(this._endCheckLocalPos.x);
                let centerZ = Math.round(this._endCheckLocalPos.z);
                console.log("坐标转换行列值" + i + "----col：" + centerX + "----row：" + centerZ);
                let item:GameGridMapItem = this._mapItemList[centerZ][centerX];
                if(item.isEmpty){
                    emptyNum ++;
                    itemArr.push(item);
                }else{
                    //存在非空网格
                    break;
                }
            }
            else{
                //不在网格地图范围内
                break;
            }
        }

        let checkListX:number[] = [];
        let checkListY:number[] = [];
        let isRight = emptyNum == num && num > 0;
        if(isRight){
            for(let i = 0; i < itemArr.length; i ++){
                itemArr[i].setEmpty(false);
                let col:number = itemArr[i].col;
                let row:number = itemArr[i].row;
                if(checkListX.indexOf(col) == -1){
                    checkListX.push(col);
                }
                if(checkListY.indexOf(row) == -1){
                    checkListY.push(row);
                }
            }
        }

        for(let i:number = checkListX.length - 1; i >= 0; i--){
            let col:number = checkListX[i];
            for(let row:number = 0; row < 10; row++){
                if(this._mapItemList[row][col].isEmpty){
                    checkListX.splice(i,1);
                    break; 
                }
            }
        }
        for(let i:number = checkListY.length - 1; i >= 0 ; i--){
            let row:number = checkListY[i];
            for(let col:number = 0; col < 10; col++){
                if(this._mapItemList[row][col].isEmpty){
                    checkListY.splice(i,1);
                    break; 
                }
            }
        }
        let canRemove:boolean = false;
        let lenX:number = checkListX.length;
        let lenY:number = checkListY.length;
        for(let i:number = 0; i < lenX; i++){
            let col:number = checkListX[i];
            for(let row:number = 0; row < 10; row++){
                this._mapItemList[row][col].setEmpty(true,true,1);//1、纵向消除
                canRemove = true
            }
        }
        for(let i:number = 0; i < lenY ; i++){
            let row:number = checkListY[i];
            for(let col:number = 0; col < 10; col++){
                this._mapItemList[row][col].setEmpty(true,true,2);//2、横向消除
                canRemove = true
            }
        }
        
        return {isRight:isRight,canRemove:canRemove,totalNum:lenX + lenY};
    }

    private _lastPreviewList:number[][] = [];
    private OnTouchMoveCheck(){
        let tempNodeList = this.tempGroup.children;
        let len = tempNodeList.length;
        this.clearPreview();
        for(let i = 0; i < len; i ++) {
            let grid:Node = tempNodeList[i];
            this.mapGridContainer.inverseTransformPoint(this._endCheckLocalPos,grid.worldPosition);
            if(this._endCheckLocalPos.x >= -0.5 && this._endCheckLocalPos.x <= 9.5 && this._endCheckLocalPos.z >= -0.5 && this._endCheckLocalPos.z <= 9.5){
                //在范围内，进一步检测对应网格是否是空位
                let centerX = Math.round(this._endCheckLocalPos.x);
                let centerZ = Math.round(this._endCheckLocalPos.z);
                let item:GameGridMapItem = this._mapItemList[centerZ][centerX];
                if(item.isEmpty){
                    item.setPreview(true);
                    this._lastPreviewList.push([centerX,centerZ]);
                }
            }
        }
    }

    public createPreviewGrid(resType:number,startX:number,startY:number){
        let camera = Root3D.mainCamera;
        camera.screenPointToRay(startX, startY, this._ray);
        if (PhysicsSystem.instance.raycast(this._ray)) {
            const raycastResults = PhysicsSystem.instance.raycastResults;
            if(!raycastResults) return;
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
                    this.OnTouchMoveCheck();
                    break;
                }
            }
        }
    }

    public onGridDrop():{isRight:boolean,canRemove:boolean,totalNum:number}{
        let result = this.OnTouchEndCheck();
        let tempNodeList = this.tempGroup.children;
        let len = tempNodeList.length;
        if(len > 0){
            for(let i = len - 1; i >= 0; i-- ){
                let node = tempNodeList[i];
                node.removeFromParent();
                GameGridMapView.GridPool.push(node);
            }
        }
        this.clearPreview();
        return result;
    }

    private clearPreview(){
        for(let i = 0 ; i < this._lastPreviewList.length; i++){
            let centerX = this._lastPreviewList[i][0];
            let centerZ = this._lastPreviewList[i][1];
            this._mapItemList[centerZ][centerX].setPreview(false);
        }
        this._lastPreviewList = [];
    }
}