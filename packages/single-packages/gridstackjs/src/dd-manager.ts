/**
 * dd-manager.ts 11.5.0-dev
 * Copyright (c) 2021-2024 Alain Dumesny - see GridStack root license
 */

import { DDDraggable } from './dd-draggable';
import { DDDroppable } from './dd-droppable';
import { DDResizable } from './dd-resizable';

/**
 * 在拖放实例之间共享的全局变量
 * 
 * globals that are shared across Drag & Drop instances
 */
export class DDManager {
  /** 
   * 如果设置（true | 毫秒数），拖动放置（碰撞）将仅在用户暂停后发生 
   * 
   * if set (true | in msec), dragging placement (collision) will only happen after a pause by the user */
  public static pauseDrag: boolean | number;

  /** 
   * 如果处理了鼠标按下事件，则为true 
   * 
   * true if a mouse down event was handled */
  public static mouseHandled: boolean;

  /** 
   * 正在拖动的项目
   * 
   * item being dragged */
  public static dragElement: DDDraggable;

  /** 
   * 当前悬停在其上作为放置目标的项目
   * 
   * current item we're over as drop target */
  public static dropElement: DDDroppable;

  /** 
   * 当前悬停在其上用于调整大小的项目（忽略嵌套网格的调整大小句柄）
   * 
   * current item we're over for resizing purpose (ignore nested grid resize handles) */
  public static overResizeElement: DDResizable;

}
