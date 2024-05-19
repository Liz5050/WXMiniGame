import { _decorator, Vec2 } from 'cc';

export default class RVOMath {
	/**一个足够小的正数 */
	public static readonly RVO_EPSILON = 0.00001;
	/**一个表示正无穷的数 */
	public static readonly RVO_POSITIVEINFINITY = 10000000000000;
	public static abs(vector: Vec2) {
		return this.sqrt(this.absSq(vector));
	}
	public static absSq(vector: Vec2) {
		return vector.x * vector.x + vector.y * vector.y;
	}

	public static absSq2(vector1: Vec2, vector2: Vec2) {
		return vector1.x * vector2.x + vector1.y * vector2.y;
	}

	public static det(v1: Vec2, v2: Vec2) {
		return v1.x * v2.y - v1.y * v2.x;
	}
	public static distSqPointLineSegment(vector1: Vec2, vector2: Vec2, vector3: Vec2) {
		let r = this.absSq2(vector3.clone().subtract(vector1), vector2.clone().subtract(vector1)) / this.absSq(vector2.subtract(vector1));
		if (r < 0) {
			return this.absSq(vector3.clone().subtract(vector1));
		}
		if (r > 1) {
			return this.absSq(vector3.clone().subtract(vector2));
		}
		return this.absSq(vector3.subtract(vector1.add(vector2.clone().subtract(vector1).multiplyScalar(r))));
	}
	public static fabs(scalar: number) {
		return Math.abs(scalar);
	}
	public static leftOf(a: Vec2, b: Vec2, c: Vec2) {
		return this.det(a.subtract(c), b.subtract(a));
	}
	public static sqr(scalar: number) {
		return scalar * scalar;
	}
	public static sqrt(scalar: number) {
		return Math.sqrt(scalar);
	}
	/**
	 * 转换单精度
	 * @param value 
	 * @returns 
	 */
	public static transfromFloat(value: number) {
		return Math.floor(value * 10) / 10;
	}


	/**
	 * 除法
	 * @param vector 
	 * @param scalar 
	 * @returns 
	 */
	public static divisionScalar(vector: Vec2, scalar: number) {
		return new Vec2(vector.x / scalar, vector.y / scalar);
	}

	/**
	* 加法
	* @param vector1 
	* @param Vec2 
	*/
    public static addition(vector1: Vec2, vector2: Vec2):Vec2 {
        return new Vec2(vector1.x + vector2.x, vector1.y + vector2.y);
    }

	public static normalize(vec: Vec2):Vec2{
		return this.divisionScalar(vec,RVOMath.abs(vec));
	}
}



// import Vector2D from "./Vector2D";

// export default class RVOMath {
//   static RVO_EPSILON = 0.01;

//   static absSq(v: Vector2D) {
//     return v.multiply(v);
//   }

//   static normalize(v: Vector2D) {
//     return v.scale(1 / RVOMath.abs(v)); // v / abs(v)
//   }

//   static distSqPointLineSegment(a, b, c) {
//     var aux1 = c.minus(a);
//     var aux2 = b.minus(a);

//     // r = ((c - a) * (b - a)) / absSq(b - a)
//     var r = aux1.multiply(aux2) / RVOMath.absSq(aux2);

//     if (r < 0) {
//       return RVOMath.absSq(aux1); // absSq(c - a)
//     } else if (r > 1) {
//       return RVOMath.absSq(aux2);// absSq(c - b)
//     } else {
//       return RVOMath.absSq(c.minus(a.plus(aux2.scale(r))));// absSq(c - (a + r * (b - a)))
//     }
//   }

//   static sqr(p: number): number {
//     return p * p;
//   }

//   static det(v1: Vector2D, v2: Vector2D): number {
//     return v1.x * v2.y - v1.y * v2.x;
//   }

//   static abs(v): number {
//     return Math.sqrt(RVOMath.absSq(v));
//   }

//   static leftOf(a: Vector2D, b: Vector2D, c: Vector2D): number {
//     return RVOMath.det(a.minus(c), b.minus(a));
//   }
// }