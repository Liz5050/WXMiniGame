import { math } from "cc";
import { EntityState, EntityType } from "../utils/EntityUtil";
import EntityVo from "./EntityVo";

/**地图格子槽位数据（固定不动） */
export class GridEntityVo extends EntityVo{
    public col:number = 0;
    public row:number = 0;
    /** 是否为空 */
    public isEmpty:boolean = true;
    /** 是否为预览状态 */
    public isPreview:boolean = false;

    public constructor(){
        super();
        this.type = EntityType.Grid;
    }

    public update(data:Partial<GridEntityVo>){
        super.update(data);
    }

    protected onInit(): void {
        super.onInit();
    }

    public get modelUrl(): string {
        return "gameGrid3D/BlueGrid";
    }

    public getShowName(): string {
        return `Grid_${this.col}_${this.row}`;
    }
}
