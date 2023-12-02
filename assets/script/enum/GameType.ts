import Mgr from "../manager/Mgr";
import { UIModuleEnum } from "./UIDefine";

export enum GameType {
	Shulte = 1001,
	Grid = 1002,
	Memory = 1003,
	GameBall = 1004,
}

export enum GameSubType {
	Shulte3X3 = 3,
	Shulte4X4 = 4,
	Shulte5X5 = 5,
	Shulte6X6 = 6,
	Shulte7X7 = 7,
	Shulte8X8 = 8,
}

export class GameResData{
	public moduleId:UIModuleEnum;
	public type:GameType;
	public resList:string[];
	public isAllReady:boolean = false;
	public loadRes(callBack){
		if(this.isAllReady){
			callBack();
		}
		else{
			let resLen = this.resList.length;
			let completeNum = 0;
			for(let i = 0; i < resLen; i++){
				Mgr.loader.LoadUIPrefab(this.moduleId,this.resList[i],(asset)=>{
					console.log("GameResData资源加载完成" + this.resList[i],asset);
					completeNum ++;
					if(completeNum >= resLen){
						this.isAllReady = true;
						callBack();
					}
				});
			}
		}
	}
}

export class GameDefine {
	public static ShulteSubTypes = [GameSubType.Shulte3X3,GameSubType.Shulte4X4,GameSubType.Shulte5X5,GameSubType.Shulte6X6,GameSubType.Shulte7X7,GameSubType.Shulte8X8];
	public static GameRes:{[type:number]:GameResData} = {}

	public static getGameRes(type:GameType):GameResData{
		let resData:GameResData = GameDefine.GameRes[type];
		if(!resData){
			resData = new GameResData();
			resData.type = type;
			GameDefine.GameRes[type] = resData;

			if(type == GameType.Grid){
				resData.moduleId = UIModuleEnum.gameGrid;
				resData.resList = ["GameGridMapItem","ScoreAddItem"];
			}
			else if(type == GameType.GameBall){
				resData.moduleId = UIModuleEnum.gameBall;
				resData.resList = ["BallItem","Enemy"];
			}
			else if(type == GameType.Shulte){
				resData.moduleId = UIModuleEnum.gameShulte;
				resData.resList = ["ShulteGridItemShow","ShulteGridItem"];
			}
			else{
				resData.isAllReady = true;
			}
		}
		return resData;
	}
}