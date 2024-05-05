import { Node, ScrollView } from "cc";
import { UIModuleEnum } from "../../../enum/UIDefine";
import { BaseUIView } from "../../base/BaseUIView";

export class GameBuildHeroView extends BaseUIView{

    private _scroll:ScrollView;
    private _content:Node;

    // private _heroItemList:
    public constructor(){
        super(UIModuleEnum.gameGrid3D,"GameBuildHeroView");
    }
}