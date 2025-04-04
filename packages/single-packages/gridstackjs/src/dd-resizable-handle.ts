/**
 * dd-resizable-handle.ts 11.5.0-dev
 * Copyright (c) 2021-2024  Alain Dumesny - see GridStack root license
 */

import { isTouch, pointerdown, touchend, touchmove, touchstart } from './dd-touch';
import { GridItemHTMLElement } from './gridstack';

export interface DDResizableHandleOpt {
  /** 开始调整大小时触发的回调函数 */
  start?: (event) => void;
  /** 调整大小过程中触发的回调函数 */
  move?: (event) => void;
  /** 结束调整大小时触发的回调函数 */
  stop?: (event) => void;
}

export class DDResizableHandle {
  /** @internal */
  protected el: HTMLElement;
  /** @internal 在移动足够像素开始调整大小后为 true */
  protected moving = false;
  /** @internal */
  protected mouseDownEvent: MouseEvent;
  /** @internal */
  protected static prefix = 'ui-resizable-';

  /**
   * 为网格项创建一个新的可调整大小的句柄。
   * @param host - 将要变为可调整大小的网格项 HTML 元素
   * @param dir - 调整大小句柄的方向/方位
   * @param option - 可调整大小句柄的配置选项
   * 
   * 构造函数初始化事件绑定（确保正确的 this 上下文），
   * 并通过调用内部 _init() 方法来设置调整大小句柄。
   */
  constructor(protected host: GridItemHTMLElement, protected dir: string, protected option: DDResizableHandleOpt) {
    // 创建事件绑定变量，绑定 this 上下文到方法上，以便在事件处理时保持正确的 this 引用
    this._mouseDown = this._mouseDown.bind(this);
    this._mouseMove = this._mouseMove.bind(this);
    this._mouseUp = this._mouseUp.bind(this);
    this._keyEvent = this._keyEvent.bind(this);

    // 初始化调整大小句柄
    this._init();
  }

  /** @internal */
  protected _init(): DDResizableHandle {
    // 创建一个新的 div 元素作为调整大小的句柄
    const el = this.el = document.createElement('div');
    // 添加基础调整大小句柄类
    el.classList.add('ui-resizable-handle');
    // 添加特定方向的类（如 ui-resizable-se 表示东南方向）
    el.classList.add(`${DDResizableHandle.prefix}${this.dir}`);
    // 设置较高的 z-index 确保句柄在上层
    el.style.zIndex = '100';
    // 禁用文本选择
    el.style.userSelect = 'none';
    // 将句柄添加到宿主元素
    this.host.appendChild(this.el);
    // 添加鼠标按下事件监听器
    this.el.addEventListener('mousedown', this._mouseDown);
    
    // 如果是触摸设备，添加触摸相关事件监听器
    if (isTouch) {
      this.el.addEventListener('touchstart', touchstart);
      this.el.addEventListener('pointerdown', pointerdown);
      // this.el.style.touchAction = 'none'; // 不需要，与 pointerdown 文档注释不同
    }
    return this;
  }

  /** 当需要移除和清理调整大小句柄时调用此方法 */
  public destroy(): DDResizableHandle {
    // 如果正在移动中，触发鼠标抬起事件来结束移动
    if (this.moving) this._mouseUp(this.mouseDownEvent);
    // 移除鼠标按下事件监听器
    this.el.removeEventListener('mousedown', this._mouseDown);
    // 如果是触摸设备，移除触摸相关事件监听器
    if (isTouch) {
      this.el.removeEventListener('touchstart', touchstart);
      this.el.removeEventListener('pointerdown', pointerdown);
    }
    // 从宿主元素中移除句柄元素
    this.host.removeChild(this.el);
    // 删除句柄和宿主元素的引用
    delete this.el;
    delete this.host;
    // 返回实例自身，支持链式调用
    return this;
  }

  /** @internal 在鼠标在我们身上按下时调用：在整个文档上捕获移动（鼠标可能不会停留在我们身上）直到我们释放鼠标 */
  protected _mouseDown(e: MouseEvent): void {
    // 存储鼠标按下事件，供后续使用
    this.mouseDownEvent = e;
    // 在捕获阶段添加鼠标移动事件监听器（使用 passive: true 优化性能）
    document.addEventListener('mousemove', this._mouseMove, { capture: true, passive: true});
    // 在捕获阶段添加鼠标抬起事件监听器
    document.addEventListener('mouseup', this._mouseUp, true);
    // 如果是触摸设备，添加触摸相关事件监听器
    if (isTouch) {
      this.el.addEventListener('touchmove', touchmove);
      this.el.addEventListener('touchend', touchend);
    }
    // 阻止事件冒泡和默认行为
    e.stopPropagation();
    e.preventDefault();
  }

  /** @internal */
  protected _mouseMove(e: MouseEvent): void {
    const s = this.mouseDownEvent;
    if (this.moving) {
      // 如果已经在移动中，触发移动事件
      this._triggerEvent('move', e);
    } else if (Math.abs(e.x - s.x) + Math.abs(e.y - s.y) > 2) {
      // 除非我们至少移动了 3 个像素，否则不要开始调整大小
      this.moving = true;
      // 触发开始调整大小事件
      this._triggerEvent('start', this.mouseDownEvent);
      // 触发第一次移动事件
      this._triggerEvent('move', e);
      // 现在开始监听键盘事件以支持取消操作
      document.addEventListener('keydown', this._keyEvent);
    }
    // 阻止事件冒泡
    e.stopPropagation();
    // e.preventDefault(); 由于使用了 passive: true，所以这里不能调用
  }

  /** @internal */
  protected _mouseUp(e: MouseEvent): void {
    if (this.moving) {
      // 如果正在移动中，触发停止事件
      this._triggerEvent('stop', e);
      // 移除键盘事件监听器
      document.removeEventListener('keydown', this._keyEvent);
    }
    // 移除鼠标移动事件监听器
    document.removeEventListener('mousemove', this._mouseMove, true);
    // 移除鼠标抬起事件监听器
    document.removeEventListener('mouseup', this._mouseUp, true);
    // 如果是触摸设备，移除触摸相关事件监听器
    if (isTouch) {
      this.el.removeEventListener('touchmove', touchmove);
      this.el.removeEventListener('touchend', touchend);
    }
    // 清除移动状态和鼠标按下事件
    delete this.moving;
    delete this.mouseDownEvent;
    // 阻止事件冒泡和默认行为
    e.stopPropagation();
    e.preventDefault();
  }

  /** @internal 当按键按下时调用 - 使用 Esc 键取消操作 */
  protected _keyEvent(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      // 如果按下 Esc 键，恢复初始状态并触发鼠标抬起事件结束拖拽
      this.host.gridstackNode?.grid?.engine.restoreInitial();
      this._mouseUp(this.mouseDownEvent);
    }
  }

  /** @internal 触发事件处理程序 */
  protected _triggerEvent(name: string, event: MouseEvent): DDResizableHandle {
    // 如果存在对应名称的回调函数，则调用它
    if (this.option[name]) this.option[name](event);
    // 返回实例自身，支持链式调用
    return this;
  }
}
