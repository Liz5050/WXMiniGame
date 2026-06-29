export type CreateGrid3DData = {
    resType: number;
    startX: number;
    startY: number;
}

export default class GameGrid3DConst {  
    /**方块形状数据，1代表有方块 row X col */
    public static readonly GridTypeList: { [resId: number]: number[][] } = {
        [1]: [[1]],
        [2]: [[1, 1]],
        [3]: [[1, 1, 1]],
        [4]: [[1, 1, 1, 1]],
        [5]: [[1, 1, 1, 1, 1]],
        [6]: [
            [1, 0], 
            [1, 1]
        ],
        [7]: [
            [1, 1], 
            [1, 1]
        ],
        [8]: [
            [1, 0, 0], 
            [1, 0, 0], 
            [1, 1, 1]
        ],
        [9]: [
            [1, 1, 1], 
            [1, 1, 1], 
            [1, 1, 1]
        ],
        [10]: [
            [0, 1, 0], 
            [1, 1, 1]
        ],
        [11]: [
            [1], 
            [1]
        ],
        [12]: [
            [1], 
            [1], 
            [1]
        ],
        [13]: [
            [1], 
            [1], 
            [1], 
            [1]
        ],
        [14]: [
            [1], 
            [1], 
            [1], 
            [1], 
            [1]
        ],
        [15]: [
            [1, 0], 
            [1, 1], 
            [1, 0]
        ],
    };

    public static getGridDataList(resType: number): number[][] {
        return GameGrid3DConst.GridTypeList[resType];
    }
}
