import { _decorator, Vec2 } from 'cc';

export default class Obstacle
{
    public next_: Obstacle;
    public previous_: Obstacle;
    public direction_: Vec2;
    public point_: Vec2;
    public id_: number;
    public convex_: boolean;
}



// import Vector2D from "./Vector2D";

// export default class Obstacle {
//   point: Vector2D = Vector2D.ZERO;
//   unitDir: Vector2D = Vector2D.ZERO;
//   isConvex: boolean = false;
//   id = 0;
//   previous: Obstacle;
//   next: Obstacle;
// }

