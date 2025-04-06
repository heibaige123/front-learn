/**
 * gridstack-engine.ts 11.5.0-dev
 * Copyright (c) 2021-2024  Alain Dumesny - see GridStack root license
 */

import {Utils} from './utils';
import {
    GridStackNode,
    ColumnOptions,
    GridStackPosition,
    GridStackMoveOpts,
    SaveFcn,
    CompactOptions
} from './types';

/** 更新 DOM 属性的回调函数，因为此类是通用的（没有 HTML 或其他信息），用于处理已更改的项目 - 请参阅 _notify() */
type OnChangeCB = (nodes: GridStackNode[]) => void;

/** 创建时使用的选项 - 类似于 GridStackOptions */
export interface GridStackEngineOptions {
    column?: number;
    maxRow?: number;
    float?: boolean;
    nodes?: GridStackNode[];
    onChange?: OnChangeCB;
}

/**
 * 定义了 GridStack 引擎，该引擎负责大部分与 DOM 无关的网格操作。
 * 请参阅 GridStack 方法和变量的描述。
 *
 * 注意：值不应直接修改 - 请调用主 GridStack API。
 */
export class GridStackEngine {
    public column: number; // 网格的列数
    public maxRow: number; // 网格的最大行数
    public nodes: GridStackNode[]; // 当前网格中的节点列表
    public addedNodes: GridStackNode[] = []; // 新增的节点列表
    public removedNodes: GridStackNode[] = []; // 移除的节点列表
    public batchMode: boolean; // 是否处于批量更新模式
    public defaultColumn = 12; // 默认的列数
    /** @internal 更新 DOM 属性的回调函数 */
    protected onChange: OnChangeCB;
    /** @internal 是否启用浮动模式 */
    protected _float: boolean;
    /** @internal 上一次的浮动模式状态 */
    protected _prevFloat: boolean;
    /** @internal 缓存不同列数的布局，以便可以恢复（例如 12 -> 1 -> 12） */
    protected _layouts?: GridStackNode[][]; // 映射列数到节点数组
    /** @internal 在加载期间设置（已排序），以便在碰撞节点之后添加项目 */
    public _loading?: boolean;
    /** @internal 在列调整大小期间用于跳过某些部分的标志 */
    protected _inColumnResize?: boolean;
    /** 如果为 true，则在 grid.load() 已缓存布局时可以跳过越界缓存信息 */
    public skipCacheUpdate?: boolean;
    /** @internal 如果有一些项目被锁定，则为 true */
    protected _hasLocked: boolean;
    /** @internal 唯一的全局内部 _id 计数器 */
    public static _idSeq = 0;

    /**
     * 构造函数，用于初始化 GridStackEngine 实例
     * @param opts 配置选项
     */
    public constructor(opts: GridStackEngineOptions = {}) {
        this.column = opts.column || this.defaultColumn; // 设置网格的列数，默认为 defaultColumn
        if (this.column > this.defaultColumn) this.defaultColumn = this.column; // 如果列数大于默认值，则更新默认列数
        this.maxRow = opts.maxRow; // 设置网格的最大行数
        this._float = opts.float; // 是否启用浮动模式
        this.nodes = opts.nodes || []; // 初始化节点列表
        this.onChange = opts.onChange; // 设置节点更改的回调函数
    }

    /**
     * 批量更新模式的开启和关闭
     * @param flag 是否开启批量更新模式，默认为 true
     * @param doPack 是否在关闭批量更新模式时重新整理节点，默认为 true
     * @returns 当前的 GridStackEngine 实例
     */
    public batchUpdate(flag = true, doPack = true): GridStackEngine {
        // 如果当前模式已经是目标模式，则直接返回
        if (!!this.batchMode === flag) return this;

        this.batchMode = flag; // 设置批量更新模式的状态

        if (flag) {
            // 开启批量更新模式
            this._prevFloat = this._float; // 保存当前浮动模式状态
            this._float = true; // 暂时允许节点自由移动
            this.cleanNodes(); // 清理节点的脏状态
            this.saveInitial(); // 保存初始状态，便于后续检测更改
        } else {
            // 关闭批量更新模式
            this._float = this._prevFloat; // 恢复之前的浮动模式状态
            delete this._prevFloat; // 删除临时保存的浮动模式状态
            if (doPack) this._packNodes(); // 如果需要，重新整理节点
            this._notify(); // 通知更改
        }

        return this; // 返回当前实例
    }

    /**
     * 判断是否使用整行作为碰撞检测区域
     * @param node 当前节点
     * @param nn 新位置
     * @returns 如果满足条件，返回 true，否则返回 false
     */
    protected _useEntireRowArea(node: GridStackNode, nn: GridStackPosition): boolean {
        return (
            (!this.float || (this.batchMode && !this._prevFloat)) && // 如果未启用浮动模式，或者处于批量模式且之前未启用浮动模式
            !this._hasLocked && // 如果没有锁定的节点
            (!node._moving || node._skipDown || nn.y <= node.y) // 如果节点未移动，或者跳过向下移动，或者新位置的 y 值不大于当前节点的 y 值
        );
    }

    /** @internal 修复给定节点 'node' 的碰撞问题，将其移动到新位置 'nn'，并可选地提供已找到的 'collide' 节点。
     * 如果移动了节点，则返回 true。 */
    protected _fixCollisions(
      node: GridStackNode,
      nn = node,
      collide?: GridStackNode,
      opt: GridStackMoveOpts = {}
    ): boolean {
      this.sortNodes(-1); // 从最后一个节点到第一个节点排序，以便递归碰撞时按正确顺序移动项目

      collide = collide || this.collide(node, nn); // 实际区域碰撞检测，用于交换和跳过无碰撞的情况
      if (!collide) return false;

      // 检查交换：如果我们在重力模式下主动移动，检查是否与大小相同的对象碰撞
      if (node._moving && !opt.nested && !this.float) {
        if (this.swap(node, collide)) return true;
      }

      // 在 while() 碰撞期间，确保检查整行，以防较大的项目跳过较小的项目（从网格中的最后一个项目开始向下推）
      let area = nn;
      if (!this._loading && this._useEntireRowArea(node, nn)) {
        area = {x: 0, w: this.column, y: nn.y, h: nn.h};
        collide = this.collide(node, area, opt.skip); // 强制重新检测碰撞
      }

      let didMove = false;
      const newOpt: GridStackMoveOpts = {nested: true, pack: false};
      let counter = 0;
      while ((collide = collide || this.collide(node, area, opt.skip))) {
        // 可能与多个项目碰撞，因此需要对每个项目重复处理
        if (counter++ > this.nodes.length * 2) {
          throw new Error('无限碰撞检测');
        }
        let moved: boolean;
        // 如果与锁定的项目碰撞，或者正在加载（移动到后面），或者在顶部重力模式下向下移动（并且碰撞的项目可以向上移动）-> 跳过碰撞项目，
        // 但记住跳过向下移动，以便仅执行一次（并推动其他项目）。
        if (
          collide.locked ||
          this._loading ||
          (node._moving &&
            !node._skipDown &&
            nn.y > node.y &&
            !this.float &&
            // 可以占用我们之前的位置，或者在我们将要去的位置之前
            (!this.collide(collide, {...collide, y: node.y}, node) ||
              !this.collide(collide, {...collide, y: nn.y - collide.h}, node)))
        ) {
          node._skipDown = node._skipDown || nn.y > node.y;
          const newNN = {...nn, y: collide.y + collide.h, ...newOpt};
          // 假装我们移动到了当前位置，以便继续进行任何碰撞检查 #2492
          moved =
            this._loading && Utils.samePos(node, newNN) ? true : this.moveNode(node, newNN);

          if ((collide.locked || this._loading) && moved) {
            Utils.copyPos(nn, node); // 移动到锁定项目之后成为我们新的目标位置
          } else if (!collide.locked && moved && opt.pack) {
            // 如果我们移动到了后面并将进行整理：立即执行整理并保持原始放置位置，但超出旧的碰撞位置以查看我们可能推动了什么
            this._packNodes();
            nn.y = collide.y + collide.h;
            Utils.copyPos(node, nn);
          }
          didMove = didMove || moved;
        } else {
          // 将碰撞项目向下移动到我们将要去的位置之后，忽略我们现在的位置（不要与我们自己碰撞）
          moved = this.moveNode(collide, {...collide, y: nn.y + nn.h, skip: node, ...newOpt});
        }

        if (!moved) return didMove; // 如果无法移动，则中断无限循环（例如：maxRow、固定位置）

        collide = undefined;
      }
      return didMove;
    }

    /**
     * 返回与给定节点相交的节点。可以选择使用不同的区域进行检测，并且可以跳过第二个节点。
     * @param skip 要跳过的节点
     * @param area 用于检测的区域，默认为 skip 节点的区域
     * @param skip2 要跳过的第二个节点（可选）
     * @returns 如果找到相交的节点，则返回该节点；否则返回 undefined
     */
    public collide(
      skip: GridStackNode,
      area = skip,
      skip2?: GridStackNode
    ): GridStackNode | undefined {
      const skipId = skip._id; // 跳过的节点 ID
      const skip2Id = skip2?._id; // 跳过的第二个节点 ID（如果存在）
      return this.nodes.find(
        (n) => n._id !== skipId && n._id !== skip2Id && Utils.isIntercepted(n, area)
      );
    }
    /**
     * 返回与给定节点相交的所有节点。可以选择使用不同的区域进行检测，并且可以跳过第二个节点。
     * @param skip 要跳过的节点
     * @param area 用于检测的区域，默认为 skip 节点的区域
     * @param skip2 要跳过的第二个节点（可选）
     * @returns 返回与给定区域相交的所有节点
     */
    public collideAll(skip: GridStackNode, area = skip, skip2?: GridStackNode): GridStackNode[] {
      const skipId = skip._id; // 跳过的节点 ID
      const skip2Id = skip2?._id; // 跳过的第二个节点 ID（如果存在）
      return this.nodes.filter(
        (n) => n._id !== skipId && n._id !== skip2Id && Utils.isIntercepted(n, area)
      );
    }

    /** 基于像素覆盖的碰撞检测，返回覆盖率超过 50% 的节点 */
    protected directionCollideCoverage(
      node: GridStackNode,
      o: GridStackMoveOpts,
      collides: GridStackNode[]
    ): GridStackNode | undefined {
      if (!o.rect || !node._rect) return;
      const r0 = node._rect; // 起始位置
      const r = {...o.rect}; // 当前拖动位置

      // 更新拖动矩形以显示其来源方向（上方、下方等）
      if (r.y > r0.y) {
        r.h += r.y - r0.y;
        r.y = r0.y;
      } else {
        r.h += r0.y - r.y;
      }
      if (r.x > r0.x) {
        r.w += r.x - r0.x;
        r.x = r0.x;
      } else {
        r.w += r0.x - r.x;
      }

      let collide: GridStackNode;
      let overMax = 0.5; // 需要超过 50% 的覆盖率
      for (let n of collides) {
        if (n.locked || !n._rect) {
          break;
        }
        const r2 = n._rect; // 重叠目标
        let yOver = Number.MAX_VALUE,
          xOver = Number.MAX_VALUE;
        // 根据起始方向计算覆盖率百分比
        // （例如：从上方/下方仅计算最大水平线覆盖率）
        if (r0.y < r2.y) {
          // 从上方
          yOver = (r.y + r.h - r2.y) / r2.h;
        } else if (r0.y + r0.h > r2.y + r2.h) {
          // 从下方
          yOver = (r2.y + r2.h - r.y) / r2.h;
        }
        if (r0.x < r2.x) {
          // 从左侧
          xOver = (r.x + r.w - r2.x) / r2.w;
        } else if (r0.x + r0.w > r2.x + r2.w) {
          // 从右侧
          xOver = (r2.x + r2.w - r.x) / r2.w;
        }
        const over = Math.min(xOver, yOver);
        if (over > overMax) {
          overMax = over;
          collide = n;
        }
      }
      o.collide = collide; // 保存结果以避免重复查找
      return collide;
    }

    /** 通过像素覆盖返回覆盖面积最大的节点 */
    /*
    protected collideCoverage(r: GridStackPosition, collides: GridStackNode[]): {collide: GridStackNode, over: number} {
    const collide: GridStackNode;
    const overMax = 0;
    collides.forEach(n => {
      if (n.locked || !n._rect) return;
      const over = Utils.areaIntercept(r, n._rect);
      if (over > overMax) {
      overMax = over;
      collide = n;
      }
    });
    return {collide, over: overMax};
    }
    */

    /** 用于缓存节点的像素矩形，在拖动期间用于碰撞检测 */
    public cacheRects(
      w: number,
      h: number,
      top: number,
      right: number,
      bottom: number,
      left: number
    ): GridStackEngine {
      this.nodes.forEach(
        (n) =>
          (n._rect = {
            y: n.y * h + top, // 计算矩形的顶部位置
            x: n.x * w + left, // 计算矩形的左侧位置
            w: n.w * w - left - right, // 计算矩形的宽度
            h: n.h * h - top - bottom // 计算矩形的高度
          })
      );
      return this;
    }

    /**
     * 尝试在两个节点之间进行交换（相同大小或列，不锁定，接触），如果成功返回 true
     * @param a 第一个节点
     * @param b 第二个节点
     * @returns 如果交换成功返回 true，否则返回 false 或 undefined
     */
    public swap(a: GridStackNode, b: GridStackNode): boolean | undefined {
      if (!b || b.locked || !a || a.locked) return false;

      function _doSwap(): true {
        // 假设 a 在 b 之前 IFF 它们具有不同的高度（放在 b 之后而不是完全交换）
        const x = b.x,
          y = b.y;
        b.x = a.x;
        b.y = a.y; // b -> 移动到 a 的位置
        if (a.h != b.h) {
          a.x = x;
          a.y = b.y + b.h; // a -> 移动到 b 的后面
        } else if (a.w != b.w) {
          a.x = b.x + b.w;
          a.y = y; // a -> 移动到 b 的后面
        } else {
          a.x = x;
          a.y = y; // a -> 移动到 b 的旧位置
        }
        a._dirty = b._dirty = true;
        return true;
      }
      let touching: boolean; // 记录是否调用了接触检测（vs undefined）

      // 如果大小相同并且在同一行或列上，并且接触
      if (
        a.w === b.w &&
        a.h === b.h &&
        (a.x === b.x || a.y === b.y) &&
        (touching = Utils.isTouching(a, b))
      )
        return _doSwap();
      if (touching === false) return; // 如果检测失败，直接返回

      // 检查是否占用相同的列（但高度不同）并且接触
      if (a.w === b.w && a.x === b.x && (touching || (touching = Utils.isTouching(a, b)))) {
        if (b.y < a.y) {
          const t = a;
          a = b;
          b = t;
        } // 交换 a 和 b 的变量，使 a 在前
        return _doSwap();
      }
      if (touching === false) return;

      // 检查是否占用相同的行（但宽度不同）并且接触
      if (a.h === b.h && a.y === b.y && (touching || (touching = Utils.isTouching(a, b)))) {
        if (b.x < a.x) {
          const t = a;
          a = b;
          b = t;
        } // 交换 a 和 b 的变量，使 a 在前
        return _doSwap();
      }
      return false;
    }

    public isAreaEmpty(x: number, y: number, w: number, h: number): boolean {
        const nn: GridStackNode = {x: x || 0, y: y || 0, w: w || 1, h: h || 1};
        return !this.collide(nn);
    }

    /** re-layout grid items to reclaim any empty space - optionally keeping the sort order exactly the same ('list' mode) vs truly finding an empty spaces */
    public compact(layout: CompactOptions = 'compact', doSort = true): GridStackEngine {
        if (this.nodes.length === 0) return this;
        if (doSort) this.sortNodes();
        const wasBatch = this.batchMode;
        if (!wasBatch) this.batchUpdate();
        const wasColumnResize = this._inColumnResize;
        if (!wasColumnResize) this._inColumnResize = true; // faster addNode()
        const copyNodes = this.nodes;
        this.nodes = []; // pretend we have no nodes to conflict layout to start with...
        copyNodes.forEach((n, index, list) => {
            let after: GridStackNode;
            if (!n.locked) {
                n.autoPosition = true;
                if (layout === 'list' && index) after = list[index - 1];
            }
            this.addNode(n, false, after); // 'false' for add event trigger
        });
        if (!wasColumnResize) delete this._inColumnResize;
        if (!wasBatch) this.batchUpdate(false);
        return this;
    }

    /** enable/disable floating widgets (default: `false`) See [example](http://gridstackjs.com/demo/float.html) */
    public set float(val: boolean) {
        if (this._float === val) return;
        this._float = val || false;
        if (!val) {
            this._packNodes()._notify();
        }
    }

    /** float getter method */
    public get float(): boolean {
        return this._float || false;
    }

    /** sort the nodes array from first to last, or reverse. Called during collision/placement to force an order */
    public sortNodes(dir: 1 | -1 = 1): GridStackEngine {
        this.nodes = Utils.sort(this.nodes, dir);
        return this;
    }

    /** @internal called to top gravity pack the items back OR revert back to original Y positions when floating */
    protected _packNodes(): GridStackEngine {
        if (this.batchMode) {
            return this;
        }
        this.sortNodes(); // first to last

        if (this.float) {
            // restore original Y pos
            this.nodes.forEach((n) => {
                if (n._updating || n._orig === undefined || n.y === n._orig.y) return;
                let newY = n.y;
                while (newY > n._orig.y) {
                    --newY;
                    const collide = this.collide(n, {x: n.x, y: newY, w: n.w, h: n.h});
                    if (!collide) {
                        n._dirty = true;
                        n.y = newY;
                    }
                }
            });
        } else {
            // top gravity pack
            this.nodes.forEach((n, i) => {
                if (n.locked) return;
                while (n.y > 0) {
                    const newY = i === 0 ? 0 : n.y - 1;
                    const canBeMoved =
                        i === 0 || !this.collide(n, {x: n.x, y: newY, w: n.w, h: n.h});
                    if (!canBeMoved) break;
                    // Note: must be dirty (from last position) for GridStack::OnChange CB to update positions
                    // and move items back. The user 'change' CB should detect changes from the original
                    // starting position instead.
                    n._dirty = n.y !== newY;
                    n.y = newY;
                }
            });
        }
        return this;
    }

    /**
     * given a random node, makes sure it's coordinates/values are valid in the current grid
     * @param node to adjust
     * @param resizing if out of bound, resize down or move into the grid to fit ?
     */
    public prepareNode(node: GridStackNode, resizing?: boolean): GridStackNode {
        node._id = node._id ?? GridStackEngine._idSeq++;

        // make sure USER supplied id are unique in our list, else assign a new one as it will create issues during load/update/etc...
        const id = node.id;
        if (id) {
            let count = 1; // append nice _n rather than some random number
            while (this.nodes.find((n) => n.id === node.id && n !== node)) {
                node.id = id + '_' + count++;
            }
        }

        // if we're missing position, have the grid position us automatically (before we set them to 0,0)
        if (node.x === undefined || node.y === undefined || node.x === null || node.y === null) {
            node.autoPosition = true;
        }

        // assign defaults for missing required fields
        const defaults: GridStackNode = {x: 0, y: 0, w: 1, h: 1};
        Utils.defaults(node, defaults);

        if (!node.autoPosition) {
            delete node.autoPosition;
        }
        if (!node.noResize) {
            delete node.noResize;
        }
        if (!node.noMove) {
            delete node.noMove;
        }
        Utils.sanitizeMinMax(node);

        // check for NaN (in case messed up strings were passed. can't do parseInt() || defaults.x above as 0 is valid #)
        if (typeof node.x == 'string') {
            node.x = Number(node.x);
        }
        if (typeof node.y == 'string') {
            node.y = Number(node.y);
        }
        if (typeof node.w == 'string') {
            node.w = Number(node.w);
        }
        if (typeof node.h == 'string') {
            node.h = Number(node.h);
        }
        if (isNaN(node.x)) {
            node.x = defaults.x;
            node.autoPosition = true;
        }
        if (isNaN(node.y)) {
            node.y = defaults.y;
            node.autoPosition = true;
        }
        if (isNaN(node.w)) {
            node.w = defaults.w;
        }
        if (isNaN(node.h)) {
            node.h = defaults.h;
        }

        this.nodeBoundFix(node, resizing);
        return node;
    }

    /** part2 of preparing a node to fit inside our grid - checks for x,y,w from grid dimensions */
    public nodeBoundFix(node: GridStackNode, resizing?: boolean): GridStackEngine {
        const before = node._orig || Utils.copyPos({}, node);

        if (node.maxW) {
            node.w = Math.min(node.w || 1, node.maxW);
        }
        if (node.maxH) {
            node.h = Math.min(node.h || 1, node.maxH);
        }
        if (node.minW) {
            node.w = Math.max(node.w || 1, node.minW);
        }
        if (node.minH) {
            node.h = Math.max(node.h || 1, node.minH);
        }

        // if user loaded a larger than allowed widget for current # of columns,
        // remember it's position & width so we can restore back (1 -> 12 column) #1655 #1985
        // IFF we're not in the middle of column resizing!
        const saveOrig = (node.x || 0) + (node.w || 1) > this.column;
        if (
            saveOrig &&
            this.column < this.defaultColumn &&
            !this._inColumnResize &&
            !this.skipCacheUpdate &&
            node._id &&
            this.findCacheLayout(node, this.defaultColumn) === -1
        ) {
            const copy = {...node}; // need _id + positions
            if (copy.autoPosition || copy.x === undefined) {
                delete copy.x;
                delete copy.y;
            } else copy.x = Math.min(this.defaultColumn - 1, copy.x);
            copy.w = Math.min(this.defaultColumn, copy.w || 1);
            this.cacheOneLayout(copy, this.defaultColumn);
        }

        if (node.w > this.column) {
            node.w = this.column;
        } else if (node.w < 1) {
            node.w = 1;
        }

        if (this.maxRow && node.h > this.maxRow) {
            node.h = this.maxRow;
        } else if (node.h < 1) {
            node.h = 1;
        }

        if (node.x < 0) {
            node.x = 0;
        }
        if (node.y < 0) {
            node.y = 0;
        }

        if (node.x + node.w > this.column) {
            if (resizing) {
                node.w = this.column - node.x;
            } else {
                node.x = this.column - node.w;
            }
        }
        if (this.maxRow && node.y + node.h > this.maxRow) {
            if (resizing) {
                node.h = this.maxRow - node.y;
            } else {
                node.y = this.maxRow - node.h;
            }
        }

        if (!Utils.samePos(node, before)) {
            node._dirty = true;
        }

        return this;
    }

    /** returns a list of modified nodes from their original values */
    public getDirtyNodes(verify?: boolean): GridStackNode[] {
        // compare original x,y,w,h instead as _dirty can be a temporary state
        if (verify) {
            return this.nodes.filter((n) => n._dirty && !Utils.samePos(n, n._orig));
        }
        return this.nodes.filter((n) => n._dirty);
    }

    /** @internal call this to call onChange callback with dirty nodes so DOM can be updated */
    protected _notify(removedNodes?: GridStackNode[]): GridStackEngine {
        if (this.batchMode || !this.onChange) return this;
        const dirtyNodes = (removedNodes || []).concat(this.getDirtyNodes());
        this.onChange(dirtyNodes);
        return this;
    }

    /** @internal remove dirty and last tried info */
    public cleanNodes(): GridStackEngine {
        if (this.batchMode) return this;
        this.nodes.forEach((n) => {
            delete n._dirty;
            delete n._lastTried;
        });
        return this;
    }

    /** @internal called to save initial position/size to track real dirty state.
     * Note: should be called right after we call change event (so next API is can detect changes)
     * as well as right before we start move/resize/enter (so we can restore items to prev values) */
    public saveInitial(): GridStackEngine {
        this.nodes.forEach((n) => {
            n._orig = Utils.copyPos({}, n);
            delete n._dirty;
        });
        this._hasLocked = this.nodes.some((n) => n.locked);
        return this;
    }

    /** @internal restore all the nodes back to initial values (called when we leave) */
    public restoreInitial(): GridStackEngine {
        this.nodes.forEach((n) => {
            if (!n._orig || Utils.samePos(n, n._orig)) return;
            Utils.copyPos(n, n._orig);
            n._dirty = true;
        });
        this._notify();
        return this;
    }

    /** find the first available empty spot for the given node width/height, updating the x,y attributes. return true if found.
     * optionally you can pass your own existing node list and column count, otherwise defaults to that engine data.
     * Optionally pass a widget to start search AFTER, meaning the order will remain the same but possibly have empty slots we skipped
     */
    public findEmptyPosition(
        node: GridStackNode,
        nodeList = this.nodes,
        column = this.column,
        after?: GridStackNode
    ): boolean {
        const start = after ? after.y * column + (after.x + after.w) : 0;
        let found = false;
        for (let i = start; !found; ++i) {
            const x = i % column;
            const y = Math.floor(i / column);
            if (x + node.w > column) {
                continue;
            }
            const box = {x, y, w: node.w, h: node.h};
            if (!nodeList.find((n) => Utils.isIntercepted(box, n))) {
                if (node.x !== x || node.y !== y) node._dirty = true;
                node.x = x;
                node.y = y;
                delete node.autoPosition;
                found = true;
            }
        }
        return found;
    }

    /** call to add the given node to our list, fixing collision and re-packing */
    public addNode(
        node: GridStackNode,
        triggerAddEvent = false,
        after?: GridStackNode
    ): GridStackNode {
        const dup = this.nodes.find((n) => n._id === node._id);
        if (dup) return dup; // prevent inserting twice! return it instead.

        // skip prepareNode if we're in middle of column resize (not new) but do check for bounds!
        this._inColumnResize ? this.nodeBoundFix(node) : this.prepareNode(node);
        delete node._temporaryRemoved;
        delete node._removeDOM;

        let skipCollision: boolean;
        if (node.autoPosition && this.findEmptyPosition(node, this.nodes, this.column, after)) {
            delete node.autoPosition; // found our slot
            skipCollision = true;
        }

        this.nodes.push(node);
        if (triggerAddEvent) {
            this.addedNodes.push(node);
        }

        if (!skipCollision) this._fixCollisions(node);
        if (!this.batchMode) {
            this._packNodes()._notify();
        }
        return node;
    }

    public removeNode(
        node: GridStackNode,
        removeDOM = true,
        triggerEvent = false
    ): GridStackEngine {
        if (!this.nodes.find((n) => n._id === node._id)) {
            // TEST console.log(`Error: GridStackEngine.removeNode() node._id=${node._id} not found!`)
            return this;
        }
        if (triggerEvent) {
            // we wait until final drop to manually track removed items (rather than during drag)
            this.removedNodes.push(node);
        }
        if (removeDOM) node._removeDOM = true; // let CB remove actual HTML (used to set _id to null, but then we loose layout info)
        // don't use 'faster' .splice(findIndex(),1) in case node isn't in our list, or in multiple times.
        this.nodes = this.nodes.filter((n) => n._id !== node._id);
        if (!node._isAboutToRemove) this._packNodes(); // if dragged out, no need to relayout as already done...
        this._notify([node]);
        return this;
    }

    public removeAll(removeDOM = true, triggerEvent = true): GridStackEngine {
        delete this._layouts;
        if (!this.nodes.length) return this;
        removeDOM && this.nodes.forEach((n) => (n._removeDOM = true)); // let CB remove actual HTML (used to set _id to null, but then we loose layout info)
        const removedNodes = this.nodes;
        this.removedNodes = triggerEvent ? removedNodes : [];
        this.nodes = [];
        return this._notify(removedNodes);
    }

    /** checks if item can be moved (layout constrain) vs moveNode(), returning true if was able to move.
     * In more complicated cases (maxRow) it will attempt at moving the item and fixing
     * others in a clone first, then apply those changes if still within specs. */
    public moveNodeCheck(node: GridStackNode, o: GridStackMoveOpts): boolean {
        // if (node.locked) return false;
        if (!this.changedPosConstrain(node, o)) return false;
        o.pack = true;

        // simpler case: move item directly...
        if (!this.maxRow) {
            return this.moveNode(node, o);
        }

        // complex case: create a clone with NO maxRow (will check for out of bounds at the end)
        let clonedNode: GridStackNode;
        const clone = new GridStackEngine({
            column: this.column,
            float: this.float,
            nodes: this.nodes.map((n) => {
                if (n._id === node._id) {
                    clonedNode = {...n};
                    return clonedNode;
                }
                return {...n};
            })
        });
        if (!clonedNode) return false;

        // check if we're covering 50% collision and could move, while still being under maxRow or at least not making it worse
        // (case where widget was somehow added past our max #2449)
        const canMove =
            clone.moveNode(clonedNode, o) && clone.getRow() <= Math.max(this.getRow(), this.maxRow);
        // else check if we can force a swap (float=true, or different shapes) on non-resize
        if (!canMove && !o.resizing && o.collide) {
            const collide = o.collide.el.gridstackNode; // find the source node the clone collided with at 50%
            if (this.swap(node, collide)) {
                // swaps and mark dirty
                this._notify();
                return true;
            }
        }
        if (!canMove) return false;

        // if clone was able to move, copy those mods over to us now instead of caller trying to do this all over!
        // Note: we can't use the list directly as elements and other parts point to actual node, so copy content
        clone.nodes
            .filter((n) => n._dirty)
            .forEach((c) => {
                const n = this.nodes.find((a) => a._id === c._id);
                if (!n) return;
                Utils.copyPos(n, c);
                n._dirty = true;
            });
        this._notify();
        return true;
    }

    /** return true if can fit in grid height constrain only (always true if no maxRow) */
    public willItFit(node: GridStackNode): boolean {
        delete node._willFitPos;
        if (!this.maxRow) return true;
        // create a clone with NO maxRow and check if still within size
        const clone = new GridStackEngine({
            column: this.column,
            float: this.float,
            nodes: this.nodes.map((n) => {
                return {...n};
            })
        });
        const n = {...node}; // clone node so we don't mod any settings on it but have full autoPosition and min/max as well! #1687
        this.cleanupNode(n);
        delete n.el;
        delete n._id;
        delete n.content;
        delete n.grid;
        clone.addNode(n);
        if (clone.getRow() <= this.maxRow) {
            node._willFitPos = Utils.copyPos({}, n);
            return true;
        }
        return false;
    }

    /** true if x,y or w,h are different after clamping to min/max */
    public changedPosConstrain(node: GridStackNode, p: GridStackPosition): boolean {
        // first make sure w,h are set for caller
        p.w = p.w || node.w;
        p.h = p.h || node.h;
        if (node.x !== p.x || node.y !== p.y) return true;
        // check constrained w,h
        if (node.maxW) {
            p.w = Math.min(p.w, node.maxW);
        }
        if (node.maxH) {
            p.h = Math.min(p.h, node.maxH);
        }
        if (node.minW) {
            p.w = Math.max(p.w, node.minW);
        }
        if (node.minH) {
            p.h = Math.max(p.h, node.minH);
        }
        return node.w !== p.w || node.h !== p.h;
    }

    /** return true if the passed in node was actually moved (checks for no-op and locked) */
    public moveNode(node: GridStackNode, o: GridStackMoveOpts): boolean {
        if (!node || /*node.locked ||*/ !o) return false;
        let wasUndefinedPack: boolean;
        if (o.pack === undefined && !this.batchMode) {
            wasUndefinedPack = o.pack = true;
        }

        // constrain the passed in values and check if we're still changing our node
        if (typeof o.x !== 'number') {
            o.x = node.x;
        }
        if (typeof o.y !== 'number') {
            o.y = node.y;
        }
        if (typeof o.w !== 'number') {
            o.w = node.w;
        }
        if (typeof o.h !== 'number') {
            o.h = node.h;
        }
        const resizing = node.w !== o.w || node.h !== o.h;
        const nn: GridStackNode = Utils.copyPos({}, node, true); // get min/max out first, then opt positions next
        Utils.copyPos(nn, o);
        this.nodeBoundFix(nn, resizing);
        Utils.copyPos(o, nn);

        if (!o.forceCollide && Utils.samePos(node, o)) return false;
        const prevPos: GridStackPosition = Utils.copyPos({}, node);

        // check if we will need to fix collision at our new location
        const collides = this.collideAll(node, nn, o.skip);
        let needToMove = true;
        if (collides.length) {
            const activeDrag = node._moving && !o.nested;
            // check to make sure we actually collided over 50% surface area while dragging
            let collide = activeDrag
                ? this.directionCollideCoverage(node, o, collides)
                : collides[0];
            // if we're enabling creation of sub-grids on the fly, see if we're covering 80% of either one, if we didn't already do that
            if (activeDrag && collide && node.grid?.opts?.subGridDynamic && !node.grid._isTemp) {
                const over = Utils.areaIntercept(o.rect, collide._rect);
                const a1 = Utils.area(o.rect);
                const a2 = Utils.area(collide._rect);
                const perc = over / (a1 < a2 ? a1 : a2);
                if (perc > 0.8) {
                    collide.grid.makeSubGrid(collide.el, undefined, node);
                    collide = undefined;
                }
            }

            if (collide) {
                needToMove = !this._fixCollisions(node, nn, collide, o); // check if already moved...
            } else {
                needToMove = false; // we didn't cover >50% for a move, skip...
                if (wasUndefinedPack) delete o.pack;
            }
        }

        // now move (to the original ask vs the collision version which might differ) and repack things
        if (needToMove && !Utils.samePos(node, nn)) {
            node._dirty = true;
            Utils.copyPos(node, nn);
        }
        if (o.pack) {
            this._packNodes()._notify();
        }
        return !Utils.samePos(node, prevPos); // pack might have moved things back
    }

    public getRow(): number {
        return this.nodes.reduce((row, n) => Math.max(row, n.y + n.h), 0);
    }

    public beginUpdate(node: GridStackNode): GridStackEngine {
        if (!node._updating) {
            node._updating = true;
            delete node._skipDown;
            if (!this.batchMode) this.saveInitial();
        }
        return this;
    }

    public endUpdate(): GridStackEngine {
        const n = this.nodes.find((n) => n._updating);
        if (n) {
            delete n._updating;
            delete n._skipDown;
        }
        return this;
    }

    /** saves a copy of the largest column layout (eg 12 even when rendering oneColumnMode) so we don't loose orig layout,
     * returning a list of widgets for serialization */
    public save(saveElement = true, saveCB?: SaveFcn): GridStackNode[] {
        // use the highest layout for any saved info so we can have full detail on reload #1849
        const len = this._layouts?.length;
        const layout = len && this.column !== len - 1 ? this._layouts[len - 1] : null;
        const list: GridStackNode[] = [];
        this.sortNodes();
        this.nodes.forEach((n) => {
            const wl = layout?.find((l) => l._id === n._id);
            // use layout info fields instead if set
            const w: GridStackNode = {...n, ...(wl || {})};
            Utils.removeInternalForSave(w, !saveElement);
            if (saveCB) saveCB(n, w);
            list.push(w);
        });
        return list;
    }

    /** @internal called whenever a node is added or moved - updates the cached layouts */
    public layoutsNodesChange(nodes: GridStackNode[]): GridStackEngine {
        if (!this._layouts || this._inColumnResize) return this;
        // remove smaller layouts - we will re-generate those on the fly... larger ones need to update
        this._layouts.forEach((layout, column) => {
            if (!layout || column === this.column) return this;
            if (column < this.column) {
                this._layouts[column] = undefined;
            } else {
                // we save the original x,y,w (h isn't cached) to see what actually changed to propagate better.
                // NOTE: we don't need to check against out of bound scaling/moving as that will be done when using those cache values. #1785
                const ratio = column / this.column;
                nodes.forEach((node) => {
                    if (!node._orig) return; // didn't change (newly added ?)
                    const n = layout.find((l) => l._id === node._id);
                    if (!n) return; // no cache for new nodes. Will use those values.
                    // Y changed, push down same amount
                    // TODO: detect doing item 'swaps' will help instead of move (especially in 1 column mode)
                    if (n.y >= 0 && node.y !== node._orig.y) {
                        n.y += node.y - node._orig.y;
                    }
                    // X changed, scale from new position
                    if (node.x !== node._orig.x) {
                        n.x = Math.round(node.x * ratio);
                    }
                    // width changed, scale from new width
                    if (node.w !== node._orig.w) {
                        n.w = Math.round(node.w * ratio);
                    }
                    // ...height always carries over from cache
                });
            }
        });
        return this;
    }

    /**
     * @internal Called to scale the widget width & position up/down based on the column change.
     * Note we store previous layouts (especially original ones) to make it possible to go
     * from say 12 -> 1 -> 12 and get back to where we were.
     *
     * @param prevColumn previous number of columns
     * @param column  new column number
     * @param layout specify the type of re-layout that will happen (position, size, etc...).
     * Note: items will never be outside of the current column boundaries. default (moveScale). Ignored for 1 column
     */
    public columnChanged(
        prevColumn: number,
        column: number,
        layout: ColumnOptions = 'moveScale'
    ): GridStackEngine {
        if (!this.nodes.length || !column || prevColumn === column) return this;

        // simpler shortcuts layouts
        const doCompact = layout === 'compact' || layout === 'list';
        if (doCompact) {
            this.sortNodes(1); // sort with original layout once and only once (new column will affect order otherwise)
        }

        // cache the current layout in case they want to go back (like 12 -> 1 -> 12) as it requires original data IFF we're sizing down (see below)
        if (column < prevColumn) this.cacheLayout(this.nodes, prevColumn);
        this.batchUpdate(); // do this EARLY as it will call saveInitial() so we can detect where we started for _dirty and collision
        let newNodes: GridStackNode[] = [];
        let nodes = doCompact ? this.nodes : Utils.sort(this.nodes, -1); // current column reverse sorting so we can insert last to front (limit collision)

        // see if we have cached previous layout IFF we are going up in size (restore) otherwise always
        // generate next size down from where we are (looks more natural as you gradually size down).
        if (column > prevColumn && this._layouts) {
            const cacheNodes = this._layouts[column] || [];
            // ...if not, start with the largest layout (if not already there) as down-scaling is more accurate
            // by pretending we came from that larger column by assigning those values as starting point
            const lastIndex = this._layouts.length - 1;
            if (
                !cacheNodes.length &&
                prevColumn !== lastIndex &&
                this._layouts[lastIndex]?.length
            ) {
                prevColumn = lastIndex;
                this._layouts[lastIndex].forEach((cacheNode) => {
                    const n = nodes.find((n) => n._id === cacheNode._id);
                    if (n) {
                        // still current, use cache info positions
                        if (!doCompact && !cacheNode.autoPosition) {
                            n.x = cacheNode.x ?? n.x;
                            n.y = cacheNode.y ?? n.y;
                        }
                        n.w = cacheNode.w ?? n.w;
                        if (cacheNode.x == undefined || cacheNode.y === undefined)
                            n.autoPosition = true;
                    }
                });
            }

            // if we found cache re-use those nodes that are still current
            cacheNodes.forEach((cacheNode) => {
                const j = nodes.findIndex((n) => n._id === cacheNode._id);
                if (j !== -1) {
                    const n = nodes[j];
                    // still current, use cache info positions
                    if (doCompact) {
                        n.w = cacheNode.w; // only w is used, and don't trim the list
                        return;
                    }
                    if (cacheNode.autoPosition || isNaN(cacheNode.x) || isNaN(cacheNode.y)) {
                        this.findEmptyPosition(cacheNode, newNodes);
                    }
                    if (!cacheNode.autoPosition) {
                        n.x = cacheNode.x ?? n.x;
                        n.y = cacheNode.y ?? n.y;
                        n.w = cacheNode.w ?? n.w;
                        newNodes.push(n);
                    }
                    nodes.splice(j, 1);
                }
            });
        }

        // much simpler layout that just compacts
        if (doCompact) {
            this.compact(layout, false);
        } else {
            // ...and add any extra non-cached ones
            if (nodes.length) {
                if (typeof layout === 'function') {
                    layout(column, prevColumn, newNodes, nodes);
                } else {
                    const ratio = doCompact || layout === 'none' ? 1 : column / prevColumn;
                    const move = layout === 'move' || layout === 'moveScale';
                    const scale = layout === 'scale' || layout === 'moveScale';
                    nodes.forEach((node) => {
                        // NOTE: x + w could be outside of the grid, but addNode() below will handle that
                        node.x =
                            column === 1
                                ? 0
                                : move
                                ? Math.round(node.x * ratio)
                                : Math.min(node.x, column - 1);
                        node.w =
                            column === 1 || prevColumn === 1
                                ? 1
                                : scale
                                ? Math.round(node.w * ratio) || 1
                                : Math.min(node.w, column);
                        newNodes.push(node);
                    });
                    nodes = [];
                }
            }

            // finally re-layout them in reverse order (to get correct placement)
            newNodes = Utils.sort(newNodes, -1);
            this._inColumnResize = true; // prevent cache update
            this.nodes = []; // pretend we have no nodes to start with (add() will use same structures) to simplify layout
            newNodes.forEach((node) => {
                this.addNode(node, false); // 'false' for add event trigger
                delete node._orig; // make sure the commit doesn't try to restore things back to original
            });
        }

        this.nodes.forEach((n) => delete n._orig); // clear _orig before batch=false so it doesn't handle float=true restore
        this.batchUpdate(false, !doCompact);
        delete this._inColumnResize;
        return this;
    }

    /**
     * 将给定的布局缓存到指定列索引的位置，以便在列大小更改时可以恢复
     * @param nodes 节点列表
     * @param column 对应的列索引
     * @param clear 如果为 true，将强制清除其他缓存（默认为 false）
     */
    public cacheLayout(nodes: GridStackNode[], column: number, clear = false): GridStackEngine {
        const copy: GridStackNode[] = [];
        nodes.forEach((n, i) => {
            // 确保我们有一个 id，以防这是新的布局，否则重用已设置的 id
            if (n._id === undefined) {
                const existing = n.id ? this.nodes.find((n2) => n2.id === n.id) : undefined; // 使用用户的 id 查找现有节点
                n._id = existing?._id ?? GridStackEngine._idSeq++;
            }
            copy[i] = {x: n.x, y: n.y, w: n.w, _id: n._id}; // 仅更改 x, y, w 和 id 以便后续查找
        });
        this._layouts = clear ? [] : this._layouts || []; // 使用数组快速查找更大的布局
        this._layouts[column] = copy;
        return this;
    }

    /**
     * 将单个节点的布局缓存到指定列索引的位置，以便在列大小更改时可以恢复
     * @param node 要缓存的单个节点
     * @param column 对应的列索引
     */
    public cacheOneLayout(node: GridStackNode, column: number): GridStackEngine {
        node._id = node._id ?? GridStackEngine._idSeq++;
        const layoutNode: GridStackNode = {x: node.x, y: node.y, w: node.w, _id: node._id};
        if (node.autoPosition || node.x === undefined) {
            delete layoutNode.x;
            delete layoutNode.y;
            if (node.autoPosition) layoutNode.autoPosition = true;
        }
        this._layouts = this._layouts || [];
        this._layouts[column] = this._layouts[column] || [];
        const index = this.findCacheLayout(node, column);
        if (index === -1) {
            this._layouts[column].push(layoutNode);
        } else {
            this._layouts[column][index] = layoutNode;
        }
        return this;
    }

    /**
     * 在布局缓存中查找指定节点的位置
     * @param n 要查找的节点
     * @param column 对应的列索引
     * @returns 节点在布局缓存中的索引，如果未找到则返回 -1
     */
    protected findCacheLayout(n: GridStackNode, column: number): number {
        return this._layouts?.[column]?.findIndex((l) => l._id === n._id) ?? -1;
    }

    /**
     * 从布局缓存中移除指定节点
     * @param n 要移除的节点
     */
    public removeNodeFromLayoutCache(n: GridStackNode): void {
        if (!this._layouts) return;
        this._layouts.forEach((layout, i) => {
            const index = this.findCacheLayout(n, i);
            if (index !== -1) {
                layout.splice(index, 1);
            }
        });
    }

    /** 清理节点的所有内部值，仅保留 _id */
    public cleanupNode(node: GridStackNode): GridStackEngine {
        for (const prop in node) {
            if (prop.startsWith('_') && prop !== '_id') {
                delete node[prop];
            }
        }
        return this;
    }
}
