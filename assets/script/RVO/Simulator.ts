import { _decorator, Vec2 } from 'cc';
import Agent from "./Agent";
import KdTree from "./KdTree";
import Obstacle from "./Obstacle";
import RVOMath from "./RVOMath";

export default class Simulator {
    private static _instance: Simulator;
    public static get Instance() {
        if (!Simulator._instance) {
            Simulator._instance = new Simulator();
        }
        return Simulator._instance;
    }
    public static s_totalID = 0;
    public agentNo2indexDict_: Map<number, number>;
    public index2agentNoDict_: Map<number, number>;
    public agents_: Array<Agent> = [];
    public obstacles_: Array<Obstacle> = [];
    public kdTree_: KdTree;
    public timeStep_: number;
    private defaultAgent_: Agent;
    private globalTime_: number;
    constructor() {
        this.init();
    }
    private init() {
        this.agents_ = [];
        this.agentNo2indexDict_ = new Map();
        this.index2agentNoDict_ = new Map();
        this.defaultAgent_ = null;
        this.kdTree_ = new KdTree();
        this.obstacles_ = [];
        this.globalTime_ = 0;
        this.timeStep_ = 0.1;
    }
    public doStep() {
        this.updateDeleteAgent();
        this.kdTree_.buildAgentTree();
        for (let i = 0, j = this.agents_.length; i < j; i++) {
            let agent = this.agents_[i];
            agent.computeNeighbors();
            agent.computeNewVelocity();
        }
        for (let i = 0, j = this.agents_.length; i < j; i++) {
            let agent = this.agents_[i];
            agent.update();
        }
        this.globalTime_ += this.timeStep_;
        return this.globalTime_;
    }
    private updateDeleteAgent() {
        let isDelete = false;
        for (let i = this.agents_.length - 1; i >= 0; i--) {
            if (this.agents_[i].needDelete_) {
                this.agents_.splice(i, 1);
                isDelete = true;
            }
        }
        if (isDelete)
            this.onDelAgent();
    }
    public addAgent(position: Vec2) {
        if (this.defaultAgent_ == null) return -1;
        let agent = new Agent();
        agent.id_ = Simulator.s_totalID;
        Simulator.s_totalID++;
        agent.maxNeighbors_ = this.defaultAgent_.maxNeighbors_;
        agent.maxSpeed_ = this.defaultAgent_.maxSpeed_;
        agent.neighborDist_ = this.defaultAgent_.neighborDist_;
        agent.position_ = position;
        agent.radius_ = this.defaultAgent_.radius_;
        agent.timeHorizon_ = this.defaultAgent_.timeHorizon_;
        agent.timeHorizonObst_ = this.defaultAgent_.timeHorizonObst_;
        agent.velocity_ = this.defaultAgent_.velocity_;
        this.agents_.push(agent);
        this.onAddAgent();
        return agent.id_;
    }
    public delAgent(agentNo:number){
        if(agentNo < 0) return;
        let agent = this.agents_[this.agentNo2indexDict_[agentNo]];
        if(agent) {
            this.kdTree_.queryNearAgent(agent);
            agent.needDelete_ = true;
        }
    }
    public addObstacle(vertices: Array<Vec2>) {
        if (vertices.length < 2) return -1;
        let obstacleNo = this.obstacles_.length;
        for (let i = 0; i < vertices.length; ++i) {
            let obstacle = new Obstacle();
            obstacle.point_ = vertices[i];
            if (i != 0) {
                obstacle.previous_ = this.obstacles_[this.obstacles_.length - 1];
                obstacle.previous_.next_ = obstacle;
            }
            if (i == vertices.length - 1) {
                obstacle.next_ = this.obstacles_[obstacleNo];
                obstacle.next_.previous_ = obstacle;
            }
            obstacle.direction_ = vertices[(i == vertices.length - 1 ? 0 : i + 1)].clone().subtract(vertices[i]).normalize();
            if (vertices.length == 2) {
                obstacle.convex_ = true;
            } else {
                obstacle.convex_ = (RVOMath.leftOf(vertices[(i == 0 ? vertices.length - 1 : i - 1)], vertices[i], vertices[(i == vertices.length - 1 ? 0 : i + 1)]) >= 0);
            }
            obstacle.id_ = this.obstacles_.length;
            this.obstacles_.push(obstacle);
        }
        return obstacleNo;
    }
    private onDelAgent() {
        this.agentNo2indexDict_.clear();
        this.index2agentNoDict_.clear();
        for (let i = 0; i < this.agents_.length; i++) {
            let agentNo = this.agents_[i].id_;
            this.agentNo2indexDict_.set(agentNo, i);
            this.index2agentNoDict_.set(i, agentNo);
        }
    }
    private onAddAgent() {
        if (this.agents_.length == 0)
            return;
        let index = this.agents_.length - 1;
        let agentNo = this.agents_[index].id_;
        this.agentNo2indexDict_.set(agentNo, index);
        this.index2agentNoDict_.set(index, agentNo);
    }
    public getAgentPosition(agentNo: number) {
        let agent = this.agents_[this.agentNo2indexDict_.get(agentNo)];
        if (agent) {
            return agent.position_;
        } else {
            return new Vec2(0, 0);
        }
    }
    public updateAgentPosition(agentNo:number,position:Vec2){
        let agent = this.agents_[this.agentNo2indexDict_.get(agentNo)];
        if (agent) {
            agent.position_ = position;
        }
    }
    public getAgentPrefVelocity(agentNo: number) {
        return this.agents_[this.agentNo2indexDict_.get(agentNo)].prefVelocity_;
    }
    public setTimeStep(timeStep: number) {
        this.timeStep_ = timeStep;
    }
    /**
     * @param neighborDist 该代理在导航中考虑到的与其他代理的最大距离(中心点到中心点)。必须是正的
     * 这个数字越大，模拟的运行时间就越长。如果数值过低，模拟将不安全。
     * 
     * @param maxNeighbors 此代理在导航中考虑的其他代理的最大数量。这个数字越大，模拟的运行时间就越长。如果数值过低，模拟将不安全
     * 
     * @param timeHorizon 通过模拟计算得出的该agent的速度相对于其他agent安全的最小时间。必须是正的
     * 这个数越大，这个智能体对其他智能体的反应就越快，但是这个智能体选择速度的自由度就越小。
     * 
     * @param timeHorizonObst 由模拟计算出的代理相对于障碍物安全的速度的最小时间。必须是正的
     * 这个数字越大，智能体对障碍物的反应就越快，但智能体选择速度的自由度就越小。
     * 
     * @param radius agent 半径
     * 
     * @param maxSpeed 最大速度
     * 
     * @param velocity 初始二维线速度
     **/
    public setAgentDefaults(neighborDist: number, maxNeighbors: number, timeHorizon: number, timeHorizonObst: number, radius: number, maxSpeed: number, velocity: Vec2) {
        if (this.defaultAgent_ == null) {
            this.defaultAgent_ = new Agent();
        }
        this.defaultAgent_.maxNeighbors_ = maxNeighbors;
        this.defaultAgent_.maxSpeed_ = maxSpeed;
        this.defaultAgent_.neighborDist_ = neighborDist;
        this.defaultAgent_.radius_ = radius;
        this.defaultAgent_.timeHorizon_ = timeHorizon;
        this.defaultAgent_.timeHorizonObst_ = timeHorizonObst;
        this.defaultAgent_.velocity_ = velocity;
    }
    public processObstacles() {
        this.kdTree_.buildObstacleTree();
    }
    public setAgentPrefVelocity(agentNo: number, prefVelocity: Vec2) {
        this.agents_[this.agentNo2indexDict_.get(agentNo)].prefVelocity_ = prefVelocity;
    }

    public queryNearAgent(agentNo:number){
        if(this.agents_.length == 0) return -1;
        let agent = this.agents_[this.agentNo2indexDict_[agentNo]];
        return this.kdTree_.queryNearAgent(agent);
    }
}


