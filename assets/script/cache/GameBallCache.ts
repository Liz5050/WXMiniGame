import MathUtils from "../utils/MathUtils";

export class GameBallCache {

    public curRound:number = 1;
    private _testId:number = 1;
    private _ballList:any;
    private _ballNum:number = 5;
    private _killNum:number = 0;
    //初始化游戏对局数据
    public initGameBallInfo(){
        this.curRound = 1;
        this._testId = 1;
        this._ballNum = 5;
        this._killNum = 0;
    }

    public getRoundList():any[]{
        return [];
    }

    public killUpdate(num:number){
        this._killNum += num;
        if(this._ballNum < 50){
            if(this._killNum % 3 == 0){
                this._ballNum += 1;
            }
        }
    }

    public getCurRoundData():any{
        let num = MathUtils.getRandomInt(1,3);
        let enemys = [];
        for(let i = 0; i < num; i ++){
            let hp = MathUtils.getRandomInt(100,1000);
            let xList = [0,1,2,3,4,5];
            let idx = MathUtils.getRandomInt(0,xList.length-1);
            let posX = xList.splice(idx,1)[0];
            let info = {
                id:this._testId,
                type:1,
                hp:hp,
                maxHp:hp,
                x:posX,
                y:0,
                executeRound:false,
                node:null,
            }
            enemys.push(info);
            this._testId ++;
        }
        let result = {round:this.curRound,enemys:enemys};
        this.curRound ++;
        return result;
    }

    public getBallList():any[]{
        this._ballList = [];
        for(let i = 0; i < this._ballNum; i++){
            this._ballList.push(i);
        }
        return this._ballList;
    }
}