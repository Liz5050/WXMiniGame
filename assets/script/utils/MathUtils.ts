import { math } from "cc";

export default class MathUtils {
    /**
     * 弧度制转换为角度值
     * @param radian 弧度制
     * @returns {number}
     */
    public static getAngle(radian: number): number {
        return 180 * radian / Math.PI;
    }

    /**
     * 角度值转换为弧度制
     * @param angle
     */
    public static getRadian(angle: number): number {
        return angle / 180 * Math.PI;
    }

    /**
     * 获取两点间夹角
     * @param p1X
     * @param p1Y
     * @param p2X
     * @param p2Y
     * @returns {number}
     */
    public static getAngle2(p1x:number,p1y:number,p2x:number,p2y:number):number{
        return MathUtils.getAngle(MathUtils.getRadian2(p1x,p1y,p2x,p2y));
    }

    /**
     * 获取两点间弧度
     * @param p1X
     * @param p1Y
     * @param p2X
     * @param p2Y
     * @returns {number}
     */
    public static getRadian2(p1X: number, p1Y: number, p2X: number, p2Y: number): number {
        var xdis: number = p2X - p1X;
        var ydis: number = p2Y - p1Y;
        return Math.atan2(ydis,xdis);
    }

    /**
     * 获取范围随机数
     */
    public static getRandom(min:number,max:number):number{
        let ret:number = min + Math.random()*(max-min+1);
        return ret;
    }

    /**
     * 获取范围随机数整数
     */
    public static getRandomInt(min:number,max:number):number{
        let ret:number = min + Math.floor(Math.random()*(max-min+1));
        return ret;
    }

    /**
     * 求一个向量的反射向量 3d
     * @param inVec 入射向量
     * @param N 法向量
     * @returns 反射向量
     */
    public static reflect(inVec: math.Vec3, N: math.Vec3) {
        let vec = N.multiplyScalar(2 * math.Vec2.dot(inVec, N));
        return inVec.subtract(vec);
    }

    /**
    * 求一个向量的反射向量 2d
    * @param inVec 入射向量
    * @param N 法向量
    * @returns 反射向量
    */
    public static reflect_v2(inVec: math.Vec2, N: math.Vec2) {
        let vec = N.multiplyScalar(2 * math.Vec2.dot(inVec, N));
        return inVec.subtract(vec);
    }

    /**
     * 获取两点间距离
     * @param p1X
     * @param p1Y
     * @param p2X
     * @param p2Y
     * @returns {number}
     */
    public static getDistance(p1X: number, p1Y: number, p2X: number, p2Y: number): number {
        var disX: number = p2X - p1X;
        var disY: number = p2Y - p1Y;
        var disQ: number = disX * disX + disY * disY;
        return Math.sqrt(disQ);
    }
}
