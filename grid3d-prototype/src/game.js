(function () {
    "use strict";

    const GRID_SIZE = 10;
    const CORE_MIN = 4;
    const CORE_MAX = 5;
    const LINE_EXP_TO_LEVEL = GRID_SIZE;
    const INITIAL_GOLD = 45;
    const MAX_CORE_HP = 100;
    const PLACE_COST_PER_CELL = 2;
    const BATTLE_GRID_COST = 15;
    const CHANGE_UNIT_COST = 5;
    const LINE_REWARD = 8;
    const INTEREST_GOLD_STEP = 10;
    const CORE_CENTER = { x: 5, y: 5 };
    const HERO_AGGRO_RANGE = GRID_SIZE / 2;
    const EARLY_ROUND_ENEMY_COUNTS = [3, 4, 5, 6, 7];
    const EARLY_ROUND_BONUS_GOLD = [0, 8, 7, 6, 5];
    const CORE_GUARD_POINTS = [
        { x: 4.5, y: 3.7 },
        { x: 5.5, y: 3.7 },
        { x: 6.3, y: 4.5 },
        { x: 6.3, y: 5.5 },
        { x: 5.5, y: 6.3 },
        { x: 4.5, y: 6.3 },
        { x: 3.7, y: 5.5 },
        { x: 3.7, y: 4.5 }
    ];

    const UnitDefs = {
        melee: {
            label: "近战守卫",
            short: "M",
            color: "#60a5fa",
            hp: 30,
            hpLevel: 6,
            attack: 4,
            attackLevel: 1,
            range: 0.55,
            speed: 1.35,
            cooldown: 0.75
        },
        ranged: {
            label: "远程射手",
            short: "R",
            color: "#a78bfa",
            hp: 20,
            hpLevel: 4,
            attack: 5,
            attackLevel: 1,
            range: 2.7,
            speed: 0.95,
            cooldown: 1.05
        },
        repair: {
            label: "修复师",
            short: "H",
            color: "#34d399",
            hp: 22,
            hpLevel: 4,
            attack: 1,
            attackLevel: 1,
            range: 2.2,
            speed: 0.9,
            cooldown: 1.35,
            heal: 5,
            healLevel: 2
        }
    };

    const EnemyDef = {
        color: "#fb7185",
        hp: 18,
        hpRound: 5,
        hpCurve: 2,
        attack: 3,
        attackRound: 1,
        attackCurve: 0.75,
        range: 0.48,
        speed: 0.88,
        cooldown: 0.75
    };

    const ShapeTemplates = [
        { name: "单格", color: "#60a5fa", cells: [[0, 0]] },
        { name: "双连", color: "#38bdf8", cells: [[0, 0], [0, 1]] },
        { name: "三连", color: "#a78bfa", cells: [[0, 0], [0, 1], [0, 2]] },
        { name: "短竖", color: "#f59e0b", cells: [[0, 0], [1, 0]] },
        { name: "方块", color: "#34d399", cells: [[0, 0], [0, 1], [1, 0], [1, 1]] },
        { name: "L 形", color: "#fb7185", cells: [[0, 0], [1, 0], [1, 1]] },
        { name: "T 形", color: "#f472b6", cells: [[0, 0], [0, 1], [0, 2], [1, 1]] },
        { name: "折线", color: "#22c55e", cells: [[0, 1], [0, 2], [1, 0], [1, 1]] }
    ];

    const dom = {
        canvas: document.getElementById("gameCanvas"),
        toastLayer: document.getElementById("toastLayer"),
        confirmOverlay: document.getElementById("confirmOverlay"),
        confirmTitle: document.getElementById("confirmTitle"),
        confirmMessage: document.getElementById("confirmMessage"),
        confirmCancelButton: document.getElementById("confirmCancelButton"),
        confirmOkButton: document.getElementById("confirmOkButton"),
        startGameButton: document.getElementById("startGameButton"),
        startBattleButton: document.getElementById("startBattleButton"),
        rotateButton: document.getElementById("rotateButton"),
        phaseText: document.getElementById("phaseText"),
        roundText: document.getElementById("roundText"),
        goldStat: document.getElementById("goldStat"),
        goldText: document.getElementById("goldText"),
        interestText: document.getElementById("interestText"),
        coreText: document.getElementById("coreText"),
        coreMeter: document.getElementById("coreMeter"),
        shapeList: document.getElementById("shapeList"),
        selectedCellText: document.getElementById("selectedCellText"),
        cellInfo: document.getElementById("cellInfo"),
        unitButtons: Array.from(document.querySelectorAll(".unit-button")),
        actorText: document.getElementById("actorText"),
        killText: document.getElementById("killText"),
        logList: document.getElementById("logList")
    };

    const ctx = dom.canvas.getContext("2d");
    const render = {
        width: 900,
        height: 720,
        dpr: 1,
        board: { x: 0, y: 0, size: 0, cell: 0 },
        hoverCell: null,
        messages: []
    };

    const state = {
        phase: "idle",
        round: 1,
        gold: INITIAL_GOLD,
        coreHp: MAX_CORE_HP,
        maxCoreHp: MAX_CORE_HP,
        cells: [],
        shapes: [],
        selectedShapeIndex: null,
        selectedUnitType: null,
        selectedCell: null,
        actors: [],
        battleStats: {
            kills: 0,
            enemiesToSpawn: 0,
            spawnedEnemies: 0,
            spawnTimer: 0,
            coreCooldown: 0,
            endDelay: 0
        },
        buildCheckpoint: null,
        goldGainFx: {
            amount: 0,
            time: 0
        },
        nextActorId: 1,
        uiDirty: true,
        lastTime: 0
    };

    let pendingConfirmAction = null;

    function createCell(row, col) {
        return {
            row,
            col,
            filled: false,
            isCore: col >= CORE_MIN && col <= CORE_MAX && row >= CORE_MIN && row <= CORE_MAX,
            isBattleGrid: false,
            tileLevel: 1,
            rowProgress: 0,
            colProgress: 0,
            summonUnitType: null,
            hasSummonedThisBattle: false,
            flash: 0
        };
    }

    function resetGame() {
        hideConfirm();
        clearLog();
        state.phase = "build";
        state.round = 1;
        state.gold = INITIAL_GOLD;
        state.coreHp = MAX_CORE_HP;
        state.maxCoreHp = MAX_CORE_HP;
        state.cells = [];
        state.actors = [];
        state.selectedShapeIndex = null;
        state.selectedUnitType = null;
        state.selectedCell = null;
        state.nextActorId = 1;
        render.hoverCell = null;
        render.messages = [];
        state.buildCheckpoint = null;
        clearGoldGainFx();
        resetBattleStats();

        for (let row = 0; row < GRID_SIZE; row += 1) {
            for (let col = 0; col < GRID_SIZE; col += 1) {
                state.cells.push(createCell(row, col));
            }
        }

        state.shapes = [createRandomShape(), createRandomShape(), createRandomShape()];
        state.buildCheckpoint = createBuildCheckpoint();
        pushLog("游戏开始：构建阶段，初始金币 45。");
        markDirty();
    }

    function resetToIdle() {
        hideConfirm();
        clearLog();
        state.phase = "idle";
        state.round = 1;
        state.gold = INITIAL_GOLD;
        state.coreHp = MAX_CORE_HP;
        state.maxCoreHp = MAX_CORE_HP;
        state.cells = [];
        state.shapes = [];
        state.selectedShapeIndex = null;
        state.selectedUnitType = null;
        state.selectedCell = null;
        state.actors = [];
        state.nextActorId = 1;
        render.hoverCell = null;
        render.messages = [];
        state.buildCheckpoint = null;
        clearGoldGainFx();
        resetBattleStats();
        pushLog("点击“开始游戏”进入原型。");
        markDirty();
    }

    function resetBattleStats() {
        state.battleStats = {
            kills: 0,
            enemiesToSpawn: 0,
            spawnedEnemies: 0,
            spawnTimer: 0,
            coreCooldown: 0,
            endDelay: 0
        };
    }

    function clearGoldGainFx() {
        state.goldGainFx.amount = 0;
        state.goldGainFx.time = 0;
        if (dom.goldStat) {
            dom.goldStat.classList.remove("is-gold-bonus");
            dom.goldStat.removeAttribute("data-interest-gain");
        }
    }

    function getInterestForGold(gold) {
        return Math.floor(Math.max(0, gold) / INTEREST_GOLD_STEP);
    }

    function triggerGoldGainFx(amount) {
        if (amount <= 0) {
            clearGoldGainFx();
            return;
        }
        state.goldGainFx.amount = amount;
        state.goldGainFx.time = 0.95;
        if (dom.goldStat) {
            dom.goldStat.classList.remove("is-gold-bonus");
            void dom.goldStat.offsetWidth;
            dom.goldStat.dataset.interestGain = "+ " + amount + " 利息";
            dom.goldStat.classList.add("is-gold-bonus");
        }
    }

    function createBuildCheckpoint() {
        return {
            round: state.round,
            gold: state.gold,
            coreHp: state.coreHp,
            maxCoreHp: state.maxCoreHp,
            nextActorId: state.nextActorId,
            shapes: state.shapes.map(function (shape) {
                return {
                    id: shape.id,
                    name: shape.name,
                    color: shape.color,
                    cost: shape.cost,
                    cells: shape.cells.map(function (cell) {
                        return { row: cell.row, col: cell.col };
                    })
                };
            }),
            cells: state.cells.map(function (cell) {
                return {
                    row: cell.row,
                    col: cell.col,
                    filled: cell.filled,
                    isCore: cell.isCore,
                    isBattleGrid: cell.isBattleGrid,
                    tileLevel: cell.tileLevel,
                    rowProgress: cell.rowProgress || 0,
                    colProgress: cell.colProgress || 0,
                    summonUnitType: cell.summonUnitType,
                    hasSummonedThisBattle: false,
                    flash: 0
                };
            })
        };
    }

    function restoreBuildCheckpoint(snapshot) {
        if (!snapshot) return false;

        state.phase = "build";
        state.round = snapshot.round;
        state.gold = snapshot.gold;
        state.coreHp = snapshot.coreHp;
        state.maxCoreHp = snapshot.maxCoreHp;
        state.nextActorId = snapshot.nextActorId;
        state.shapes = snapshot.shapes.map(function (shape) {
            return {
                id: shape.id,
                name: shape.name,
                color: shape.color,
                cost: shape.cost,
                cells: shape.cells.map(function (cell) {
                    return { row: cell.row, col: cell.col };
                })
            };
        });
        state.cells = snapshot.cells.map(function (cell) {
            return {
                row: cell.row,
                col: cell.col,
                filled: cell.filled,
                isCore: cell.isCore,
                isBattleGrid: cell.isBattleGrid,
                tileLevel: cell.tileLevel,
                rowProgress: cell.rowProgress || 0,
                colProgress: cell.colProgress || 0,
                summonUnitType: cell.summonUnitType,
                hasSummonedThisBattle: false,
                flash: 0
            };
        });
        state.selectedShapeIndex = null;
        state.selectedUnitType = null;
        state.selectedCell = null;
        state.actors = [];
        render.hoverCell = null;
        render.messages = [];
        resetBattleStats();
        markDirty();
        return true;
    }

    function createRandomShape() {
        const template = ShapeTemplates[Math.floor(Math.random() * ShapeTemplates.length)];
        const cells = template.cells.map(function (cell) {
            return { row: cell[0], col: cell[1] };
        });
        return {
            id: "shape-" + Math.random().toString(36).slice(2),
            name: template.name,
            cells,
            color: template.color,
            cost: cells.length * PLACE_COST_PER_CELL
        };
    }

    function getCell(row, col) {
        if (row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE) return null;
        return state.cells[row * GRID_SIZE + col];
    }

    function markDirty() {
        state.uiDirty = true;
    }

    function phaseLabel() {
        if (state.phase === "build") return "构建";
        if (state.phase === "battle") return "战斗";
        return "未开始";
    }

    function selectShape(index) {
        if (state.phase !== "build") return;
        state.selectedShapeIndex = state.selectedShapeIndex === index ? null : index;
        if (state.selectedShapeIndex !== null) {
            state.selectedUnitType = null;
            state.selectedCell = null;
        }
        markDirty();
    }

    function rotateSelectedShape() {
        if (state.phase !== "build") {
            notify("构建阶段才能旋转方块。", "warn");
            return;
        }
        const shape = state.shapes[state.selectedShapeIndex];
        if (!shape) {
            notify("请先选择一个候选方块。", "warn");
            return;
        }
        const rotated = shape.cells.map(function (cell) {
            return { row: cell.col, col: -cell.row };
        });
        normalizeCells(rotated);
        shape.cells = rotated;
        markDirty();
    }

    function normalizeCells(cells) {
        let minRow = Infinity;
        let minCol = Infinity;
        cells.forEach(function (cell) {
            minRow = Math.min(minRow, cell.row);
            minCol = Math.min(minCol, cell.col);
        });
        cells.forEach(function (cell) {
            cell.row -= minRow;
            cell.col -= minCol;
        });
    }

    function canPlaceShape(shape, baseRow, baseCol) {
        if (!shape) return { ok: false, reason: "未选择方块。" };
        if (state.gold < shape.cost) return { ok: false, reason: "金币不足，无法放置。" };

        for (const part of shape.cells) {
            const cell = getCell(baseRow + part.row, baseCol + part.col);
            if (!cell) return { ok: false, reason: "方块超出棋盘。" };
            if (cell.filled) return { ok: false, reason: "目标位置已有构建块。" };
        }
        return { ok: true, reason: "" };
    }

    function placeSelectedShape(baseRow, baseCol) {
        if (state.phase !== "build") return;
        const shape = state.shapes[state.selectedShapeIndex];
        const check = canPlaceShape(shape, baseRow, baseCol);
        if (!check.ok) {
            notify(check.reason, "error");
            cancelSelectedShape();
            return;
        }

        shape.cells.forEach(function (part) {
            const cell = getCell(baseRow + part.row, baseCol + part.col);
            cell.filled = true;
            cell.flash = 0.3;
        });
        state.gold -= shape.cost;
        pushLog("放置 " + shape.name + "，消耗 " + shape.cost + " 金币。");
        state.shapes[state.selectedShapeIndex] = createRandomShape();
        state.selectedShapeIndex = null;
        resolveLines();
        markDirty();
    }

    function isOccupiedForLine(cell) {
        return cell.filled;
    }

    function resolveLines() {
        const fullRows = [];
        const fullCols = [];

        for (let row = 0; row < GRID_SIZE; row += 1) {
            let full = true;
            for (let col = 0; col < GRID_SIZE; col += 1) {
                if (!isOccupiedForLine(getCell(row, col))) {
                    full = false;
                    break;
                }
            }
            if (full) fullRows.push(row);
        }

        for (let col = 0; col < GRID_SIZE; col += 1) {
            let full = true;
            for (let row = 0; row < GRID_SIZE; row += 1) {
                if (!isOccupiedForLine(getCell(row, col))) {
                    full = false;
                    break;
                }
            }
            if (full) fullCols.push(col);
        }

        if (fullRows.length === 0 && fullCols.length === 0) return;

        for (const row of fullRows) {
            addRowProgress(row);
            for (let col = 0; col < GRID_SIZE; col += 1) {
                const cell = getCell(row, col);
                cell.filled = false;
            }
        }

        for (const col of fullCols) {
            addColumnProgress(col);
            for (let row = 0; row < GRID_SIZE; row += 1) {
                const cell = getCell(row, col);
                cell.filled = false;
            }
        }

        const clearCount = fullRows.length + fullCols.length;
        const comboBonus = clearCount > 1 ? (clearCount - 1) * 6 : 0;
        const reward = clearCount * LINE_REWARD + comboBonus;
        state.gold += reward;
        pushLog("消除 " + clearCount + " 条行列，获得 " + reward + " 金币，推进对应行列经验。");
    }

    function addRowProgress(row) {
        for (let col = 0; col < GRID_SIZE; col += 1) {
            const cell = getCell(row, col);
            if (cell.rowProgress === 0) {
                cell.rowProgress = 1;
                cell.flash = 0.5;
                break;
            }
        }

        if (getRowProgress(row) >= LINE_EXP_TO_LEVEL) {
            for (let col = 0; col < GRID_SIZE; col += 1) {
                const cell = getCell(row, col);
                cell.rowProgress = 0;
                cell.tileLevel += 1;
                cell.flash = 0.65;
            }
            pushLog("第 " + (row + 1) + " 行累计 " + LINE_EXP_TO_LEVEL + " 经验，整行升到 Lv." + getCell(row, 0).tileLevel + "。");
        }
    }

    function addColumnProgress(col) {
        for (let row = GRID_SIZE - 1; row >= 0; row -= 1) {
            const cell = getCell(row, col);
            if (cell.colProgress === 0) {
                cell.colProgress = 1;
                cell.flash = 0.5;
                break;
            }
        }

        if (getColumnProgress(col) >= LINE_EXP_TO_LEVEL) {
            for (let row = 0; row < GRID_SIZE; row += 1) {
                const cell = getCell(row, col);
                cell.colProgress = 0;
                cell.tileLevel += 1;
                cell.flash = 0.65;
            }
            pushLog("第 " + (col + 1) + " 列累计 " + LINE_EXP_TO_LEVEL + " 经验，整列升到 Lv." + getCell(0, col).tileLevel + "。");
        }
    }

    function getRowProgress(row) {
        let progress = 0;
        for (let col = 0; col < GRID_SIZE; col += 1) {
            progress += getCell(row, col).rowProgress ? 1 : 0;
        }
        return progress;
    }

    function getColumnProgress(col) {
        let progress = 0;
        for (let row = 0; row < GRID_SIZE; row += 1) {
            progress += getCell(row, col).colProgress ? 1 : 0;
        }
        return progress;
    }

    function selectCell(row, col) {
        if (state.phase !== "build") return;
        state.selectedCell = getCell(row, col);
        markDirty();
    }

    function selectUnit(unitType) {
        if (state.phase !== "build") return;
        state.selectedUnitType = state.selectedUnitType === unitType ? null : unitType;
        if (state.selectedUnitType) {
            state.selectedShapeIndex = null;
        }
        markDirty();
    }

    function cancelSelectedShape() {
        state.selectedShapeIndex = null;
        markDirty();
    }

    function cancelSelectedUnit() {
        state.selectedUnitType = null;
        markDirty();
    }

    function configureCell(targetCell, unitType) {
        if (state.phase !== "build") return;
        state.selectedCell = targetCell;
        const cell = targetCell;
        if (!cell) {
            notify("请先选择目标地块。", "warn");
            cancelSelectedUnit();
            return;
        }
        if (!unitType) {
            notify("请先选择要配置的作战单位。", "warn");
            cancelSelectedUnit();
            return;
        }
        if (cell.isCore) {
            notify("核心区域不可配置战斗格。", "error");
            cancelSelectedUnit();
            markDirty();
            return;
        }
        if (cell.summonUnitType === unitType) {
            notify("该地块已经配置为" + UnitDefs[unitType].label + "。", "warn");
            cancelSelectedUnit();
            markDirty();
            return;
        }

        const cost = cell.isBattleGrid ? CHANGE_UNIT_COST : BATTLE_GRID_COST;
        if (state.gold < cost) {
            notify("金币不足，配置需要 " + cost + " 金币。", "error");
            cancelSelectedUnit();
            markDirty();
            return;
        }

        state.gold -= cost;
        cell.isBattleGrid = true;
        cell.summonUnitType = unitType;
        cell.flash = 0.45;
        pushLog("地块 [" + (cell.col + 1) + "," + (cell.row + 1) + "] 配置为" + UnitDefs[unitType].label + "。");
        state.selectedUnitType = null;
        markDirty();
    }

    function startBattle() {
        if (state.phase !== "build") {
            notify("请先开始游戏并进入构建阶段。", "warn");
            return;
        }

        state.phase = "battle";
        state.selectedShapeIndex = null;
        state.selectedUnitType = null;
        state.selectedCell = null;
        state.actors = [];
        resetBattleStats();
        state.battleStats.enemiesToSpawn = getEnemyCountForRound(state.round);
        state.battleStats.coreCooldown = 0.25;

        state.cells.forEach(function (cell) {
            cell.hasSummonedThisBattle = false;
            if (cell.isBattleGrid && cell.summonUnitType) {
                spawnHeroFromCell(cell);
                cell.hasSummonedThisBattle = true;
            }
        });

        pushLog("第 " + state.round + " 轮战斗开始：敌人 " + state.battleStats.enemiesToSpawn + " 个。");
        markDirty();
    }

    function getEnemyCountForRound(round) {
        if (round <= EARLY_ROUND_ENEMY_COUNTS.length) {
            return EARLY_ROUND_ENEMY_COUNTS[round - 1];
        }
        const ramp = round - EARLY_ROUND_ENEMY_COUNTS.length;
        return 7 + ramp + Math.floor(Math.pow(ramp, 1.18));
    }

    function spawnHeroFromCell(cell) {
        const def = UnitDefs[cell.summonUnitType];
        const level = cell.tileLevel;
        const hp = def.hp + def.hpLevel * (level - 1);
        const guardPoint = getGuardPointForActor(state.nextActorId);
        const actor = {
            id: state.nextActorId,
            team: "player",
            kind: cell.summonUnitType,
            x: cell.col + 0.5,
            y: cell.row + 0.5,
            hp,
            maxHp: hp,
            attack: def.attack + def.attackLevel * (level - 1),
            range: def.range,
            speed: def.speed,
            cooldown: 0.2,
            cooldownMax: def.cooldown,
            sourceCell: cell,
            guardX: guardPoint.x,
            guardY: guardPoint.y,
            radius: 0.18,
            hitFlash: 0
        };
        state.nextActorId += 1;
        state.actors.push(actor);
    }

    function spawnEnemy() {
        const side = Math.floor(Math.random() * 4);
        let x = 0;
        let y = 0;
        if (side === 0) {
            x = Math.random() * GRID_SIZE;
            y = -0.6;
        } else if (side === 1) {
            x = GRID_SIZE + 0.6;
            y = Math.random() * GRID_SIZE;
        } else if (side === 2) {
            x = Math.random() * GRID_SIZE;
            y = GRID_SIZE + 0.6;
        } else {
            x = -0.6;
            y = Math.random() * GRID_SIZE;
        }

        const hp = getEnemyHpForRound(state.round);
        state.actors.push({
            id: state.nextActorId,
            team: "enemy",
            kind: "enemy",
            x,
            y,
            hp,
            maxHp: hp,
            attack: getEnemyAttackForRound(state.round),
            range: EnemyDef.range,
            speed: getEnemySpeedForRound(state.round),
            cooldown: 0.3,
            cooldownMax: EnemyDef.cooldown,
            sourceCell: null,
            radius: 0.18,
            hitFlash: 0
        });
        state.nextActorId += 1;
        state.battleStats.spawnedEnemies += 1;
    }

    function getEnemyHpForRound(round) {
        const earlyRound = Math.min(round, EARLY_ROUND_ENEMY_COUNTS.length);
        const lateRamp = Math.max(0, round - EARLY_ROUND_ENEMY_COUNTS.length);
        return EnemyDef.hp + EnemyDef.hpRound * earlyRound + lateRamp * 8 + EnemyDef.hpCurve * lateRamp * lateRamp;
    }

    function getEnemyAttackForRound(round) {
        const earlyRound = Math.min(round, EARLY_ROUND_ENEMY_COUNTS.length);
        const lateRamp = Math.max(0, round - EARLY_ROUND_ENEMY_COUNTS.length);
        return EnemyDef.attack + Math.floor(EnemyDef.attackRound * earlyRound * 0.65) + Math.floor(EnemyDef.attackCurve * lateRamp);
    }

    function getEnemySpeedForRound(round) {
        const ramp = Math.max(0, round - 1);
        return EnemyDef.speed + Math.min(0.42, ramp * 0.025);
    }

    function updateBattle(dt) {
        if (state.phase !== "battle") return;
        const stats = state.battleStats;
        stats.spawnTimer -= dt;
        if (stats.spawnedEnemies < stats.enemiesToSpawn && stats.spawnTimer <= 0) {
            spawnEnemy();
            stats.spawnTimer = 0.75;
        }

        stats.coreCooldown -= dt;
        if (stats.coreCooldown <= 0) {
            coreCannonFire();
            stats.coreCooldown = 0.58;
        }

        for (const actor of state.actors) {
            actor.cooldown = Math.max(0, actor.cooldown - dt);
            actor.hitFlash = Math.max(0, actor.hitFlash - dt);
            if (actor.team === "player") updateHero(actor, dt);
            if (state.phase !== "battle") return;
        }

        for (const actor of state.actors) {
            if (actor.team === "enemy") updateEnemy(actor, dt);
            if (state.phase !== "battle") return;
        }

        cleanupDeadActors();
        if (state.phase !== "battle") return;

        const enemyCount = countActors("enemy");
        if (stats.spawnedEnemies >= stats.enemiesToSpawn && enemyCount === 0) {
            stats.endDelay += dt;
            if (stats.endDelay > 0.55) endBattle();
        } else {
            stats.endDelay = 0;
        }
    }

    function updateHero(actor, dt) {
        if (actor.hp <= 0) return;

        if (actor.kind === "repair" && state.coreHp < state.maxCoreHp && actor.cooldown <= 0) {
            const def = UnitDefs.repair;
            const heal = def.heal + def.healLevel * (actor.sourceCell.tileLevel - 1);
            state.coreHp = Math.min(state.maxCoreHp, state.coreHp + heal);
            actor.cooldown = actor.cooldownMax;
            addFloatingMessage("+" + heal, CORE_CENTER.x, CORE_CENTER.y, "#68d391");
            return;
        }

        const target = findNearestActor(actor.x, actor.y, "enemy", HERO_AGGRO_RANGE);
        if (!target) {
            moveBackToGuardPoint(actor, dt);
            return;
        }
        const dist = distance(actor, target);
        if (dist > actor.range) {
            moveToward(actor, target.x, target.y, actor.speed * dt);
            return;
        }
        if (actor.cooldown <= 0) {
            damageActor(target, actor.attack);
            actor.cooldown = actor.cooldownMax;
            if (actor.kind === "ranged") {
                addProjectile(actor.x, actor.y, target.x, target.y, "#93c5fd", "ranged");
            }
            addFloatingMessage("-" + actor.attack, target.x, target.y, "#f8fafc");
        }
    }

    function updateEnemy(actor, dt) {
        if (actor.hp <= 0) return;

        const heroTarget = findNearestActor(actor.x, actor.y, "player", 1.35);
        if (heroTarget) {
            const dist = distance(actor, heroTarget);
            if (dist > actor.range) {
                moveToward(actor, heroTarget.x, heroTarget.y, actor.speed * dt);
            } else if (actor.cooldown <= 0) {
                damageActor(heroTarget, actor.attack);
                actor.cooldown = actor.cooldownMax;
            }
            return;
        }

        const coreDist = distanceToPoint(actor.x, actor.y, CORE_CENTER.x, CORE_CENTER.y);
        if (coreDist > 1.05) {
            moveToward(actor, CORE_CENTER.x, CORE_CENTER.y, actor.speed * dt);
        } else if (actor.cooldown <= 0) {
            state.coreHp = Math.max(0, state.coreHp - actor.attack);
            actor.cooldown = actor.cooldownMax;
            addFloatingMessage("-" + actor.attack, CORE_CENTER.x, CORE_CENTER.y, "#f87171");
            if (state.coreHp <= 0) {
                rollbackBattle();
            }
        }
    }

    function rollbackBattle() {
        if (state.phase !== "battle") return;
        hideConfirm();
        if (restoreBuildCheckpoint(state.buildCheckpoint)) {
            notify("核心被摧毁，已回溯到本轮构建开始状态。请重新调整策略。", "error");
        } else {
            state.phase = "build";
            state.coreHp = Math.max(1, state.maxCoreHp);
            state.actors = [];
            resetBattleStats();
            notify("核心被摧毁，已返回构建阶段。", "error");
            markDirty();
        }
    }

    function coreCannonFire() {
        const target = findNearestActor(CORE_CENTER.x, CORE_CENTER.y, "enemy", 7.2);
        if (!target) return;
        const damage = 4 + state.round;
        damageActor(target, damage);
        addProjectile(CORE_CENTER.x, CORE_CENTER.y, target.x, target.y, "#facc15", "core");
    }

    function damageActor(actor, damage) {
        actor.hp -= damage;
        actor.hitFlash = 0.14;
    }

    function cleanupDeadActors() {
        const before = state.actors.length;
        state.actors = state.actors.filter(function (actor) {
            if (actor.hp > 0) return true;
            if (actor.team === "enemy") {
                state.battleStats.kills += 1;
                const reward = 2 + Math.floor(state.round / 3);
                state.gold += reward;
                addFloatingMessage("+" + reward, actor.x, actor.y, "#f6c95f");
            }
            return false;
        });
        if (before !== state.actors.length) markDirty();
    }

    function endBattle() {
        const earlyBonus = getEarlyRoundBonusGold(state.round);
        const reward = 10 + state.round * 2 + earlyBonus;
        const interest = getInterestForGold(state.gold);
        state.gold += reward + interest;
        state.coreHp = Math.min(state.maxCoreHp, state.coreHp + 8);
        state.round += 1;
        state.phase = "build";
        state.actors = [];
        state.cells.forEach(function (cell) {
            cell.hasSummonedThisBattle = false;
        });
        state.buildCheckpoint = createBuildCheckpoint();
        if (interest > 0) {
            triggerGoldGainFx(interest);
        } else {
            clearGoldGainFx();
        }
        pushLog("战斗胜利：奖励 " + reward + " 金币，利息 +" + interest + "，回到构建阶段。");
        markDirty();
    }

    function getEarlyRoundBonusGold(round) {
        if (round < 1 || round > EARLY_ROUND_BONUS_GOLD.length) return 0;
        return EARLY_ROUND_BONUS_GOLD[round - 1];
    }

    function findNearestActor(x, y, team, maxDistance) {
        let best = null;
        let bestDistance = typeof maxDistance === "number" ? maxDistance : Infinity;
        for (const actor of state.actors) {
            if (actor.team !== team || actor.hp <= 0) continue;
            const dist = distanceToPoint(x, y, actor.x, actor.y);
            if (dist < bestDistance) {
                bestDistance = dist;
                best = actor;
            }
        }
        return best;
    }

    function countActors(team) {
        return state.actors.filter(function (actor) {
            return actor.team === team && actor.hp > 0;
        }).length;
    }

    function getGuardPointForActor(actorId) {
        return CORE_GUARD_POINTS[actorId % CORE_GUARD_POINTS.length];
    }

    function moveBackToGuardPoint(actor, dt) {
        const guardX = typeof actor.guardX === "number" ? actor.guardX : CORE_CENTER.x;
        const guardY = typeof actor.guardY === "number" ? actor.guardY : CORE_CENTER.y;
        if (distanceToPoint(actor.x, actor.y, guardX, guardY) > 0.12) {
            moveToward(actor, guardX, guardY, actor.speed * dt);
        }
    }

    function distance(a, b) {
        return distanceToPoint(a.x, a.y, b.x, b.y);
    }

    function distanceToPoint(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    }

    function moveToward(actor, x, y, amount) {
        const dist = distanceToPoint(actor.x, actor.y, x, y);
        if (dist <= 0.001) return;
        actor.x += ((x - actor.x) / dist) * amount;
        actor.y += ((y - actor.y) / dist) * amount;
    }

    function addProjectile(fromX, fromY, toX, toY, color, style) {
        render.messages.push({
            type: "line",
            fromX,
            fromY,
            toX,
            toY,
            color,
            style: style || "ranged",
            time: 0.16,
            maxTime: 0.16
        });
    }

    function addFloatingMessage(text, x, y, color) {
        render.messages.push({
            type: "text",
            text,
            x,
            y,
            color,
            time: 0.8,
            maxTime: 0.8
        });
    }

    function pushLog(text) {
        const item = document.createElement("li");
        item.textContent = text;
        dom.logList.prepend(item);
        while (dom.logList.children.length > 12) {
            dom.logList.removeChild(dom.logList.lastElementChild);
        }
    }

    function notify(text, type) {
        pushLog(text);
        const toast = document.createElement("div");
        toast.className = "toast" + (type ? " is-" + type : "");
        toast.textContent = text;
        dom.toastLayer.appendChild(toast);
        window.setTimeout(function () {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 1900);
    }

    function showConfirm(title, message, onConfirm) {
        pendingConfirmAction = onConfirm;
        dom.confirmTitle.textContent = title;
        dom.confirmMessage.textContent = message;
        dom.confirmOverlay.hidden = false;
        dom.confirmCancelButton.focus();
    }

    function hideConfirm() {
        pendingConfirmAction = null;
        dom.confirmOverlay.hidden = true;
    }

    function confirmPendingAction() {
        const action = pendingConfirmAction;
        hideConfirm();
        if (typeof action === "function") action();
    }

    function clearLog() {
        dom.logList.innerHTML = "";
    }

    function handleCanvasClick(event) {
        const cellPos = eventToCell(event);
        if (!cellPos) return;
        if (state.phase !== "build") return;

        if (state.selectedShapeIndex !== null) {
            placeSelectedShape(cellPos.row, cellPos.col);
        } else if (state.selectedUnitType !== null) {
            configureCell(getCell(cellPos.row, cellPos.col), state.selectedUnitType);
        } else {
            selectCell(cellPos.row, cellPos.col);
        }
    }

    function handleCanvasPointerDown(event) {
        event.preventDefault();
        render.hoverCell = eventToCell(event);
        handleCanvasClick(event);
    }

    function handleCanvasMove(event) {
        render.hoverCell = eventToCell(event);
    }

    function eventToCell(event) {
        const rect = dom.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const board = render.board;
        if (x < board.x || y < board.y || x > board.x + board.size || y > board.y + board.size) {
            return null;
        }
        return {
            col: Math.floor((x - board.x) / board.cell),
            row: Math.floor((y - board.y) / board.cell)
        };
    }

    function updateUI() {
        if (state.phase === "idle") {
            dom.startGameButton.textContent = "开始游戏";
        } else {
            dom.startGameButton.textContent = "重置游戏";
        }
        dom.phaseText.textContent = phaseLabel();
        dom.roundText.textContent = String(state.round);
        dom.goldText.textContent = String(state.gold);
        dom.interestText.textContent = "利息 +" + getInterestForGold(state.gold);
        dom.coreText.textContent = Math.round(state.coreHp) + " / " + state.maxCoreHp;
        dom.coreMeter.style.width = Math.max(0, (state.coreHp / state.maxCoreHp) * 100) + "%";

        const playerCount = countActors("player");
        const enemyCount = countActors("enemy");
        dom.actorText.textContent = "单位 " + playerCount + " / 敌人 " + enemyCount;
        dom.killText.textContent = String(state.battleStats.kills);

        dom.startBattleButton.disabled = state.phase !== "build";
        dom.rotateButton.disabled = state.phase !== "build" || state.selectedShapeIndex === null;

        if (state.uiDirty) {
            renderShapeList();
            renderCellPanel();
            state.uiDirty = false;
        }
    }

    function renderShapeList() {
        dom.shapeList.innerHTML = "";
        state.shapes.forEach(function (shape, index) {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "shape-card" + (state.selectedShapeIndex === index ? " is-selected" : "");
            button.disabled = state.phase !== "build";
            button.setAttribute("aria-label", "选择方块 " + shape.name + "，消耗 " + shape.cost + " 金币");
            button.addEventListener("click", function () {
                selectShape(index);
            });

            const mini = document.createElement("div");
            mini.className = "shape-mini";
            mini.style.setProperty("--shape-color", shape.color);
            const bounds = getShapeBounds(shape.cells);
            mini.style.gridTemplateColumns = "repeat(" + bounds.cols + ", 13px)";
            mini.style.gridTemplateRows = "repeat(" + bounds.rows + ", 13px)";

            for (let row = 0; row < bounds.rows; row += 1) {
                for (let col = 0; col < bounds.cols; col += 1) {
                    const exists = shape.cells.some(function (cell) {
                        return cell.row === row && cell.col === col;
                    });
                    const part = document.createElement("span");
                    part.className = exists ? "shape-cell" : "shape-empty";
                    mini.appendChild(part);
                }
            }

            const label = document.createElement("span");
            label.innerHTML = "<span class=\"shape-name\">" + shape.name + "</span><span>占 " + shape.cells.length + " 格</span>";

            const cost = document.createElement("span");
            cost.className = "shape-cost";
            cost.textContent = shape.cost + " 金";

            button.appendChild(mini);
            button.appendChild(label);
            button.appendChild(cost);
            dom.shapeList.appendChild(button);
        });
    }

    function getShapeBounds(cells) {
        let rows = 0;
        let cols = 0;
        cells.forEach(function (cell) {
            rows = Math.max(rows, cell.row + 1);
            cols = Math.max(cols, cell.col + 1);
        });
        return { rows, cols };
    }

    function renderCellPanel() {
        const cell = state.selectedCell;
        dom.unitButtons.forEach(function (button) {
            button.disabled = state.phase !== "build";
            button.classList.toggle("is-selected", state.selectedUnitType === button.dataset.unit);
        });

        if (!cell) {
            if (state.selectedUnitType) {
                dom.selectedCellText.textContent = "配置模式";
                dom.cellInfo.textContent = "已选择" + UnitDefs[state.selectedUnitType].label + "，点击非核心格配置战斗单位。新建消耗 15 金币，更换消耗 5 金币。";
            } else {
                dom.selectedCellText.textContent = "未选择地块";
                dom.cellInfo.textContent = "点击单位按钮后，再点击非核心格配置战斗单位；或直接点击格子查看地块信息。";
            }
            return;
        }

        dom.selectedCellText.textContent = "[" + (cell.col + 1) + "," + (cell.row + 1) + "]";
        if (cell.isCore) {
            dom.cellInfo.textContent = "核心据点格：Lv." + cell.tileLevel + "，行经验 " + getRowProgress(cell.row) + "/" + LINE_EXP_TO_LEVEL + "，列经验 " + getColumnProgress(cell.col) + "/" + LINE_EXP_TO_LEVEL + "。不可配置战斗单位。";
            return;
        }

        const unit = cell.summonUnitType ? UnitDefs[cell.summonUnitType].label : "未配置";
        const cost = cell.isBattleGrid ? CHANGE_UNIT_COST : BATTLE_GRID_COST;
        const mode = state.selectedUnitType ? " 当前选择：" + UnitDefs[state.selectedUnitType].label + "。" : "";
        dom.cellInfo.textContent = "Lv." + cell.tileLevel + "，行经验 " + getRowProgress(cell.row) + "/" + LINE_EXP_TO_LEVEL + "，列经验 " + getColumnProgress(cell.col) + "/" + LINE_EXP_TO_LEVEL + "，单位：" + unit + "。配置/更换消耗 " + cost + " 金币。" + mode;
    }

    function resizeCanvas() {
        const rect = dom.canvas.getBoundingClientRect();
        const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
        render.width = Math.max(320, rect.width);
        render.height = Math.max(260, rect.height);
        render.dpr = dpr;
        dom.canvas.width = Math.floor(render.width * dpr);
        dom.canvas.height = Math.floor(render.height * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function draw(dt) {
        ctx.clearRect(0, 0, render.width, render.height);
        drawBackground();
        drawBoard(dt);
        drawActors();
        drawMessages(dt);
        drawLegend();
    }

    function drawBackground() {
        ctx.fillStyle = "#0d1118";
        ctx.fillRect(0, 0, render.width, render.height);
    }

    function drawBoard(dt) {
        const margin = render.width < 520 ? 14 : 34;
        const side = Math.min(render.width - margin * 2, render.height - margin * 2);
        const x = (render.width - side) / 2;
        const y = (render.height - side) / 2;
        const cellSize = side / GRID_SIZE;
        render.board = { x, y, size: side, cell: cellSize };

        ctx.save();
        ctx.fillStyle = "#111827";
        roundRect(ctx, x - 10, y - 10, side + 20, side + 20, 8);
        ctx.fill();

        for (const cell of state.cells) {
            cell.flash = Math.max(0, cell.flash - dt);
            drawCell(cell, x, y, cellSize);
        }

        drawSelectedCell(x, y, cellSize);
        drawPlacementPreview(x, y, cellSize);
        drawCoreOverlay(x, y, cellSize);
        ctx.restore();
    }

    function drawCell(cell, boardX, boardY, cellSize) {
        const x = boardX + cell.col * cellSize;
        const y = boardY + cell.row * cellSize;
        let fill = "#1b2332";
        if (cell.isBattleGrid) fill = "#17324a";
        if (cell.isCore) fill = "#3d321b";
        if (cell.filled) fill = cell.isCore ? "#5b4724" : "#314057";
        if (cell.flash > 0) fill = blend(fill, "#ffffff", Math.min(0.45, cell.flash));

        ctx.fillStyle = fill;
        ctx.fillRect(x + 1, y + 1, cellSize - 2, cellSize - 2);

        ctx.strokeStyle = "#303b4d";
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, cellSize, cellSize);

        if (cell.filled) {
            ctx.fillStyle = cell.isCore ? "#8c6a2d" : "#4b6688";
            ctx.fillRect(x + cellSize * 0.18, y + cellSize * 0.18, cellSize * 0.64, cellSize * 0.64);
        }

        if (cell.isBattleGrid && cell.summonUnitType) {
            ctx.strokeStyle = UnitDefs[cell.summonUnitType].color;
            ctx.lineWidth = 3;
            ctx.strokeRect(x + 4, y + 4, cellSize - 8, cellSize - 8);
            ctx.fillStyle = UnitDefs[cell.summonUnitType].color;
            ctx.font = "800 " + Math.max(12, cellSize * 0.28) + "px Segoe UI, Arial";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(UnitDefs[cell.summonUnitType].short, x + cellSize / 2, y + cellSize * 0.48);
        }

        drawProgress(cell, x, y, cellSize);
    }

    function drawSelectedCell(boardX, boardY, cellSize) {
        const cell = state.selectedCell;
        if (!cell || state.phase !== "build") return;
        const x = boardX + cell.col * cellSize;
        const y = boardY + cell.row * cellSize;
        ctx.save();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = Math.max(2, cellSize * 0.06);
        ctx.strokeRect(x + 3, y + 3, cellSize - 6, cellSize - 6);
        ctx.strokeStyle = cell.isCore ? "#f6c95f" : "#8bd4ff";
        ctx.lineWidth = Math.max(2, cellSize * 0.035);
        ctx.strokeRect(x + 7, y + 7, cellSize - 14, cellSize - 14);
        ctx.restore();
    }

    function drawProgress(cell, x, y, cellSize) {
        const barWidth = Math.max(10, cellSize - 10);
        const barHeight = Math.max(3, cellSize * 0.07);
        ctx.fillStyle = "#0c111a";
        ctx.fillRect(x + 5, y + cellSize - 8, barWidth, barHeight);
        if (cell.rowProgress) {
            ctx.fillStyle = cell.isCore ? "#f6c95f" : "#68d391";
            ctx.fillRect(x + 5, y + cellSize - 8, barWidth, barHeight);
        }

        const sideBarWidth = Math.max(3, cellSize * 0.07);
        const sideBarHeight = Math.max(10, cellSize - 10);
        ctx.fillStyle = "#0c111a";
        ctx.fillRect(x + cellSize - 8, y + 5, sideBarWidth, sideBarHeight);
        if (cell.colProgress) {
            ctx.fillStyle = cell.isCore ? "#f6c95f" : "#60a5fa";
            ctx.fillRect(x + cellSize - 8, y + 5, sideBarWidth, sideBarHeight);
        }

        ctx.fillStyle = "#dbeafe";
        ctx.font = "700 " + Math.max(9, cellSize * 0.15) + "px Segoe UI, Arial";
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillText("Lv." + cell.tileLevel, x + 5, y + 4);
    }

    function drawPlacementPreview(boardX, boardY, cellSize) {
        if (state.phase !== "build" || !render.hoverCell) return;
        const shape = state.shapes[state.selectedShapeIndex];
        if (!shape && state.selectedUnitType) {
            const cell = getCell(render.hoverCell.row, render.hoverCell.col);
            const x = boardX + render.hoverCell.col * cellSize;
            const y = boardY + render.hoverCell.row * cellSize;
            ctx.strokeStyle = cell && !cell.isCore ? UnitDefs[state.selectedUnitType].color : "#ef6f6c";
            ctx.lineWidth = 3;
            ctx.strokeRect(x + 4, y + 4, cellSize - 8, cellSize - 8);
            return;
        }
        if (!shape) {
            const x = boardX + render.hoverCell.col * cellSize;
            const y = boardY + render.hoverCell.row * cellSize;
            ctx.strokeStyle = "#8bd4ff";
            ctx.lineWidth = 2;
            ctx.strokeRect(x + 3, y + 3, cellSize - 6, cellSize - 6);
            return;
        }

        const check = canPlaceShape(shape, render.hoverCell.row, render.hoverCell.col);
        ctx.globalAlpha = 0.65;
        ctx.fillStyle = check.ok ? shape.color : "#ef6f6c";
        for (const part of shape.cells) {
            const row = render.hoverCell.row + part.row;
            const col = render.hoverCell.col + part.col;
            if (row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE) continue;
            const x = boardX + col * cellSize;
            const y = boardY + row * cellSize;
            ctx.fillRect(x + 5, y + 5, cellSize - 10, cellSize - 10);
        }
        ctx.globalAlpha = 1;
    }

    function drawCoreOverlay(boardX, boardY, cellSize) {
        const x = boardX + CORE_MIN * cellSize;
        const y = boardY + CORE_MIN * cellSize;
        const size = 2 * cellSize;
        ctx.save();
        ctx.strokeStyle = "#f6c95f";
        ctx.lineWidth = 4;
        ctx.strokeRect(x + 4, y + 4, size - 8, size - 8);
        ctx.fillStyle = "#f6c95f";
        ctx.font = "900 " + Math.max(14, cellSize * 0.3) + "px Segoe UI, Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("CORE", x + size / 2, y + size / 2);
        ctx.restore();
    }

    function drawActors() {
        if (state.phase !== "battle") return;
        const board = render.board;
        for (const actor of state.actors) {
            const screen = gridToScreen(actor.x, actor.y);
            const color = actor.team === "enemy" ? EnemyDef.color : UnitDefs[actor.kind].color;
            const radius = Math.max(7, board.cell * 0.18);

            ctx.save();
            ctx.fillStyle = actor.hitFlash > 0 ? "#ffffff" : color;
            ctx.beginPath();
            ctx.arc(screen.x, screen.y, radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.lineWidth = 2;
            ctx.strokeStyle = actor.team === "enemy" ? "#7f1d1d" : "#e0f2fe";
            ctx.stroke();

            ctx.fillStyle = "#ffffff";
            ctx.font = "800 " + Math.max(10, board.cell * 0.18) + "px Segoe UI, Arial";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            const label = actor.team === "enemy" ? "E" : UnitDefs[actor.kind].short;
            ctx.fillText(label, screen.x, screen.y);

            const hpWidth = radius * 2.4;
            const hpRatio = Math.max(0, actor.hp / actor.maxHp);
            ctx.fillStyle = "#0c111a";
            ctx.fillRect(screen.x - hpWidth / 2, screen.y - radius - 9, hpWidth, 4);
            ctx.fillStyle = actor.team === "enemy" ? "#fb7185" : "#68d391";
            ctx.fillRect(screen.x - hpWidth / 2, screen.y - radius - 9, hpWidth * hpRatio, 4);
            ctx.restore();
        }
    }

    function drawMessages(dt) {
        render.messages = render.messages.filter(function (message) {
            message.time -= dt;
            return message.time > 0;
        });

        for (const message of render.messages) {
            const alpha = Math.max(0, message.time / message.maxTime);
            ctx.save();
            ctx.globalAlpha = alpha;
            if (message.type === "line") {
                const from = gridToScreen(message.fromX, message.fromY);
                const to = gridToScreen(message.toX, message.toY);
                if (message.style === "core") {
                    ctx.strokeStyle = message.color;
                    ctx.lineWidth = 4;
                    ctx.beginPath();
                    ctx.moveTo(from.x, from.y);
                    ctx.lineTo(to.x, to.y);
                    ctx.stroke();

                    ctx.globalAlpha = alpha * 0.32;
                    ctx.strokeStyle = "#fff7ad";
                    ctx.lineWidth = 9;
                    ctx.beginPath();
                    ctx.moveTo(from.x, from.y);
                    ctx.lineTo(to.x, to.y);
                    ctx.stroke();
                } else {
                    const dx = to.x - from.x;
                    const dy = to.y - from.y;
                    const length = Math.max(1, Math.sqrt(dx * dx + dy * dy));
                    const progress = 1 - alpha;
                    const headX = from.x + dx * progress;
                    const headY = from.y + dy * progress;
                    const tailX = headX - (dx / length) * 28;
                    const tailY = headY - (dy / length) * 28;

                    ctx.strokeStyle = message.color;
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(tailX, tailY);
                    ctx.lineTo(headX, headY);
                    ctx.stroke();

                    ctx.fillStyle = "#dbeafe";
                    ctx.beginPath();
                    ctx.arc(headX, headY, 3, 0, Math.PI * 2);
                    ctx.fill();
                }
            } else {
                const pos = gridToScreen(message.x, message.y - (1 - alpha) * 0.45);
                ctx.fillStyle = message.color;
                ctx.font = "800 16px Segoe UI, Arial";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText(message.text, pos.x, pos.y);
            }
            ctx.restore();
        }
    }

    function drawLegend() {
        const items = [
            ["构建块", "#4b6688"],
            ["战斗格", "#4eb5ff"],
            ["敌人", EnemyDef.color],
            ["核心", "#f6c95f"]
        ];
        const x = 16;
        let y = 18;
        ctx.save();
        ctx.font = "700 13px Segoe UI, Arial";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        for (const item of items) {
            ctx.fillStyle = item[1];
            ctx.fillRect(x, y - 6, 12, 12);
            ctx.fillStyle = "#cbd5e1";
            ctx.fillText(item[0], x + 18, y);
            y += 20;
        }
        ctx.restore();
    }

    function gridToScreen(x, y) {
        return {
            x: render.board.x + x * render.board.cell,
            y: render.board.y + y * render.board.cell
        };
    }

    function roundRect(context, x, y, width, height, radius) {
        context.beginPath();
        context.moveTo(x + radius, y);
        context.lineTo(x + width - radius, y);
        context.quadraticCurveTo(x + width, y, x + width, y + radius);
        context.lineTo(x + width, y + height - radius);
        context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        context.lineTo(x + radius, y + height);
        context.quadraticCurveTo(x, y + height, x, y + height - radius);
        context.lineTo(x, y + radius);
        context.quadraticCurveTo(x, y, x + radius, y);
        context.closePath();
    }

    function blend(hexA, hexB, amount) {
        const a = parseHex(hexA);
        const b = parseHex(hexB);
        const mix = function (from, to) {
            return Math.round(from + (to - from) * amount);
        };
        return "rgb(" + mix(a.r, b.r) + "," + mix(a.g, b.g) + "," + mix(a.b, b.b) + ")";
    }

    function parseHex(hex) {
        const clean = hex.replace("#", "");
        return {
            r: parseInt(clean.slice(0, 2), 16),
            g: parseInt(clean.slice(2, 4), 16),
            b: parseInt(clean.slice(4, 6), 16)
        };
    }

    function updateGoldGainFx(dt) {
        if (state.goldGainFx.time <= 0) return;
        state.goldGainFx.time = Math.max(0, state.goldGainFx.time - dt);
        if (state.goldGainFx.time === 0 && dom.goldStat) {
            dom.goldStat.classList.remove("is-gold-bonus");
            dom.goldStat.removeAttribute("data-interest-gain");
        }
    }

    function tick(time) {
        if (!state.lastTime) state.lastTime = time;
        const dt = Math.min(0.05, (time - state.lastTime) / 1000);
        state.lastTime = time;

        if (state.phase === "battle") updateBattle(dt);
        updateGoldGainFx(dt);
        updateUI();
        draw(dt);
        window.requestAnimationFrame(tick);
    }

    function bindEvents() {
        dom.startGameButton.addEventListener("click", function () {
            if (state.phase === "idle") {
                resetGame();
            } else {
                showConfirm(
                    "确认重置游戏",
                    "当前棋盘、金币、战斗格和轮次都会被清空，确认回到初始状态吗？",
                    resetToIdle
                );
            }
        });
        dom.confirmCancelButton.addEventListener("click", hideConfirm);
        dom.confirmOkButton.addEventListener("click", confirmPendingAction);
        dom.confirmOverlay.addEventListener("click", function (event) {
            if (event.target === dom.confirmOverlay) hideConfirm();
        });
        dom.startBattleButton.addEventListener("click", startBattle);
        dom.rotateButton.addEventListener("click", rotateSelectedShape);
        dom.canvas.addEventListener("pointerdown", handleCanvasPointerDown, { passive: false });
        dom.canvas.addEventListener("pointermove", handleCanvasMove);
        dom.canvas.addEventListener("pointerleave", function () {
            render.hoverCell = null;
        });
        dom.unitButtons.forEach(function (button) {
            button.addEventListener("click", function () {
                selectUnit(button.dataset.unit);
            });
        });
        window.addEventListener("keydown", function (event) {
            if (event.key === "Escape" && !dom.confirmOverlay.hidden) {
                hideConfirm();
                return;
            }
            if (event.key === "r" || event.key === "R") rotateSelectedShape();
            if (event.code === "Space" && state.phase === "build") {
                event.preventDefault();
                startBattle();
            }
        });
        window.addEventListener("resize", function () {
            resizeCanvas();
            markDirty();
        });
        if ("ResizeObserver" in window) {
            const observer = new ResizeObserver(function () {
                resizeCanvas();
                markDirty();
            });
            observer.observe(dom.canvas);
        }
    }

    function boot() {
        bindEvents();
        resizeCanvas();
        pushLog("点击“开始游戏”进入原型。");
        updateUI();
        window.requestAnimationFrame(tick);
    }

    boot();
}());
