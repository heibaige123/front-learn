/**
 * touch.ts 11.5.0-dev
 * Copyright (c) 2021-2024 Alain Dumesny - see GridStack root license
 */

import { DDManager } from './dd-manager';
import { Utils } from './utils';

/**
 * Detect touch support - Windows Surface devices and other touch devices
 * should we use this instead ? (what we had for always showing resize handles)
 * /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
 * 
 * 检测当前环境是否支持触摸操作
 * 通过检查以下条件：
 * - document 或 window 对象上是否有 ontouchstart 事件
 * - 是否支持 DocumentTouch 接口
 * - 设备是否支持多点触控（通过 maxTouchPoints）
 * - 是否支持 IE 的触摸事件（msMaxTouchPoints）
 */
export const isTouch: boolean = typeof window !== 'undefined' && typeof document !== 'undefined' &&
  ('ontouchstart' in document
    || 'ontouchstart' in window
    // 不使用 TouchEvent 检测，因为在 Windows 10 Chrome 桌面版上会返回 true
    // || !!window.TouchEvent
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    || ((window as any).DocumentTouch && document instanceof (window as any).DocumentTouch)
    || navigator.maxTouchPoints > 0
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    || (navigator as any).msMaxTouchPoints > 0
  );

// interface TouchCoord {x: number, y: number};

/**
 * Touch handling helper class
 * 触摸处理辅助类
 */
class DDTouch {
  /** 
   * flag to track if touch is being handled
   * 
   * 标记触摸是否正在被处理 */
  public static touchHandled: boolean;

  /** 
   * timeout for delayed pointer leave events
   * 
   * 延迟指针离开事件的超时 */
  public static pointerLeaveTimeout: number;
}

/**
 * Get the x,y position of a touch event
 * 获取触摸事件的x,y位置
 */
// function getTouchCoords(e: TouchEvent): TouchCoord {
//   return {
//     x: e.changedTouches[0].pageX,
//     y: e.changedTouches[0].pageY
//   };
// }

/**
 * Simulate a mouse event based on a corresponding touch event
 * @param {Object} e A touch event
 * @param {String} simulatedType The corresponding mouse event
 *
 * 基于相应的触摸事件模拟鼠标事件
 * @param {Object} e 触摸事件
 * @param {String} simulatedType 相应的鼠标事件
 */
function simulateMouseEvent(e: TouchEvent, simulatedType: string) {

  // Ignore multi-touch events
  // 忽略多点触摸事件
  if (e.touches.length > 1) return;

  // Prevent "Ignored attempt to cancel a touchmove event with cancelable=false" errors
  // 防止"忽略尝试取消cancelable=false的touchmove事件"错误
  if (e.cancelable) e.preventDefault();

  // Dispatch the simulated event to the target element
  // 将模拟事件分派给目标元素
  Utils.simulateMouseEvent(e.changedTouches[0], simulatedType);
}

/**
 * Simulate a mouse event based on a corresponding Pointer event
 * @param {Object} e A pointer event
 * @param {String} simulatedType The corresponding mouse event
 *
 * 基于相应的指针事件模拟鼠标事件
 * @param {Object} e 指针事件
 * @param {String} simulatedType 相应的鼠标事件
 */
function simulatePointerMouseEvent(e: PointerEvent, simulatedType: string) {

  // Prevent "Ignored attempt to cancel a touchmove event with cancelable=false" errors
  // 防止"忽略尝试取消cancelable=false的touchmove事件"错误
  if (e.cancelable) e.preventDefault();

  // Dispatch the simulated event to the target element
  // 将模拟事件分派给目标元素
  Utils.simulateMouseEvent(e, simulatedType);
}


/**
 * Handle the touchstart events
 * @param {Object} e The widget element's touchstart event
 *
 * 处理touchstart事件
 * @param {Object} e 部件元素的touchstart事件
 */
export function touchstart(e: TouchEvent): void {
  // Ignore the event if another widget is already being handled
  // 如果另一个部件已经被处理，则忽略该事件
  if (DDTouch.touchHandled) return;
  DDTouch.touchHandled = true;

  // Simulate the mouse events
  // 模拟鼠标事件
  // simulateMouseEvent(e, 'mouseover');
  // simulateMouseEvent(e, 'mousemove');
  simulateMouseEvent(e, 'mousedown');
}

/**
 * Handle the touchmove events
 * @param {Object} e The document's touchmove event
 *
 * 处理touchmove事件
 * @param {Object} e 文档的touchmove事件
 */
export function touchmove(e: TouchEvent): void {
  // Ignore event if not handled by us
  // 如果不是由我们处理的事件，则忽略
  if (!DDTouch.touchHandled) return;

  simulateMouseEvent(e, 'mousemove');
}

/**
 * Handle the touchend events
 * @param {Object} e The document's touchend event
 *
 * 处理touchend事件
 * @param {Object} e 文档的touchend事件
 */
export function touchend(e: TouchEvent): void {

  // Ignore event if not handled
  // 如果未处理，则忽略事件
  if (!DDTouch.touchHandled) return;

  // cancel delayed leave event when we release on ourself which happens BEFORE we get this!
  // 当我们在自己上释放时取消延迟离开事件，这发生在我们得到这个之前！
  if (DDTouch.pointerLeaveTimeout) {
    window.clearTimeout(DDTouch.pointerLeaveTimeout);
    delete DDTouch.pointerLeaveTimeout;
  }

  const wasDragging = !!DDManager.dragElement;

  // Simulate the mouseup event
  // 模拟mouseup事件
  simulateMouseEvent(e, 'mouseup');
  // simulateMouseEvent(event, 'mouseout');

  // If the touch interaction did not move, it should trigger a click
  // 如果触摸交互没有移动，它应该触发一个点击
  if (!wasDragging) {
    simulateMouseEvent(e, 'click');
  }

  // Unset the flag to allow other widgets to inherit the touch event
  // 取消设置标志以允许其他部件继承触摸事件
  DDTouch.touchHandled = false;
}

/**
 * Note we don't get touchenter/touchleave (which are deprecated)
 * see https://stackoverflow.com/questions/27908339/js-touch-equivalent-for-mouseenter
 * so instead of PointerEvent to still get enter/leave and send the matching mouse event.
 *
 * 注意我们不会得到touchenter/touchleave（已弃用）
 * 请参阅 https://stackoverflow.com/questions/27908339/js-touch-equivalent-for-mouseenter
 * 所以我们使用PointerEvent来获取enter/leave并发送匹配的鼠标事件。
 */
export function pointerdown(e: PointerEvent): void {
  // console.log("pointer down")
  if (e.pointerType === 'mouse') return;
  (e.target as HTMLElement).releasePointerCapture(e.pointerId) // <- Important! 重要！
}

/**
 * Handle pointer enter events to simulate mouseenter
 * @param e The pointer event
 *
 * 处理指针进入事件以模拟mouseenter
 * @param e 指针事件
 */
export function pointerenter(e: PointerEvent): void {
  // ignore the initial one we get on pointerdown on ourself
  // 忽略我们在自己上pointerdown时得到的初始事件
  if (!DDManager.dragElement) {
    // console.log('pointerenter ignored');
    return;
  }
  // console.log('pointerenter');
  if (e.pointerType === 'mouse') return;
  simulatePointerMouseEvent(e, 'mouseenter');
}

/**
 * Handle pointer leave events to simulate mouseleave
 * @param e The pointer event
 *
 * 处理指针离开事件以模拟mouseleave
 * @param e 指针事件
 */
export function pointerleave(e: PointerEvent): void {
  // ignore the leave on ourself we get before releasing the mouse over ourself
  // by delaying sending the event and having the up event cancel us
  // 通过延迟发送事件并让up事件取消我们，忽略在释放鼠标之前在自己身上收到的离开事件
  if (!DDManager.dragElement) {
    // console.log('pointerleave ignored');
    return;
  }
  if (e.pointerType === 'mouse') return;
  DDTouch.pointerLeaveTimeout = window.setTimeout(() => {
    delete DDTouch.pointerLeaveTimeout;
    // console.log('pointerleave delayed');
    simulatePointerMouseEvent(e, 'mouseleave');
  }, 10);
}

