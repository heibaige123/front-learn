/**
 * types.ts 11.5.0-dev
 * Copyright (c) 2021-2024 Alain Dumesny - see GridStack root license
 */

import { GridStack } from './gridstack';
import { GridStackEngine } from './gridstack-engine';

/** 
 * default values for grid options - used during init and when saving out
 * 
 * 网格选项的默认值 - 在初始化和保存时使用 */
export const gridDefaults: GridStackOptions = {
  /** 
   * shows resize handles at all time on mobile devices
   * 
   * 在移动设备上始终显示调整大小的句柄 */
  alwaysShowResizeHandle: 'mobile',

  /** 
   * turns animation on
   * 
   * 启用动画效果 */
  animate: true,

  /** 
   * if true gridstack will initialize existing items
   * 
   * 如果为true，gridstack将初始化现有项目 */
  auto: true,

  /** 
   * one cell height (can be an integer (px) or a string (ex: '100px', '10em', '10rem'))
   * 
   * 单元格高度（可以是整数（px）或字符串（例如：'100px', '10em', '10rem'）） */
  cellHeight: 'auto',

  /** 
   * throttle time delay for cellHeight='auto'
   * 
   * cellHeight='auto'时的节流时间延迟 */
  cellHeightThrottle: 100,

  /** 
   * unit for cellHeight
   * 
   * cellHeight的单位 */
  cellHeightUnit: 'px',

  /** 
   * number of columns
   * 
   * 列数 */
  column: 12,

  /** 
   * draggable options
   * 
   * 可拖动选项 */
  draggable: { handle: '.grid-stack-item-content', appendTo: 'body', scroll: true },

  /** 
   * draggable handle selector
   * 
   * 可拖动句柄选择器 */
  handle: '.grid-stack-item-content',

  /** 
   * additional widget class
   * 
   * 额外的部件类名 */
  itemClass: 'grid-stack-item',

  /** 
   * gap between grid items
   * 
   * 网格项目之间的间隙 */
  margin: 10,

  /**
   *  unit for margin
   *
   * margin的单位 */
  marginUnit: 'px',

  /** 
   * maximum rows amount
   * 
   * 最大行数 */
  maxRow: 0,

  /** 
   * minimum rows amount
   * 
   * 最小行数 */
  minRow: 0,

  /** 
   * class for placeholder
   * 
   * 占位符的类名 */
  placeholderClass: 'grid-stack-placeholder',

  /** 
   * placeholder default content
   * 
   * 占位符默认内容 */
  placeholderText: '',

  /** 
   * removable options
   * 
   * 可移除选项 */
  removableOptions: {
    accept: 'grid-stack-item',
    decline: 'grid-stack-non-removable'
  },

  /** 
   * resizable options
   * 
   * 可调整大小选项 */
  resizable: { handles: 'se' },

  /** 
   * RTL layout
   * 
   * 从右到左布局 */
  rtl: 'auto',

  // **** same as not being set ****
  // **** 与未设置相同 ****
  // disableDrag: false,
  // disableResize: false,
  // float: false,
  // handleClass: null,
  // removable: false,
  // staticGrid: false,
  //removable
};

/**
 * different layout options when changing # of columns, including a custom function that takes new/old column count, and array of new/old positions
 * Note: new list may be partially already filled if we have a cache of the layout at that size and new items were added later.
 * Options are:
 * 'list' - treat items as sorted list, keeping items (un-sized unless too big for column count) sequentially reflowing them
 * 'compact' - similar to list, but using compact() method which will possibly re-order items if an empty slots are available due to a larger item needing to be pushed to next row
 * 'moveScale' - will scale and move items by the ratio new newColumnCount / oldColumnCount
 * 'move' | 'scale' - will only size or move items
 * 'none' will leave items unchanged, unless they don't fit in column count
 *
 * 改变列数时的不同布局选项，包括自定义函数，该函数接收新/旧列数和新/旧位置数组
 * 注意：如果我们在该大小有布局缓存且后来添加了新项目，则新列表可能已经部分填充
 * 选项包括：
 * 'list' - 将项目视为排序列表，保持项目顺序（除非太大而无法适应列数），顺序重新排列它们
 * 'compact' - 类似于list，但使用compact()方法，如果由于较大项目需要推到下一行而有空槽可用，则可能重新排序项目
 * 'moveScale' - 将按新列数/旧列数的比例缩放和移动项目
 * 'move' | 'scale' - 仅调整大小或移动项目
 * 'none' - 除非项目不适合列数，否则保持项目不变
 */
export type ColumnOptions = 'list' | 'compact' | 'moveScale' | 'move' | 'scale' | 'none' |
  ((column: number, oldColumn: number, nodes: GridStackNode[], oldNodes: GridStackNode[]) => void);

/** 
 * compact layout options
 * 
 * 压缩布局选项 */
export type CompactOptions = 'list' | 'compact';

/** 
 * number or string type
 * 
 * 数字或字符串类型 */
export type numberOrString = number | string;

/** 
 * GridStack HTML element extension
 * 
 * GridStack HTML元素扩展 */
export interface GridItemHTMLElement extends HTMLElement {
  /** 
   * pointer to grid node instance
   * 
   * 指向网格节点实例的指针 */
  gridstackNode?: GridStackNode;

  /** 
   * @internal
   * @internal 内部原始网格节点 */
  _gridstackNodeOrig?: GridStackNode;
}

/** 
 * Union type for GridStack elements
 * 
 * GridStack元素的联合类型 */
export type GridStackElement = string | HTMLElement | GridItemHTMLElement;

/** 
 * specific and general event handlers for the .on() method
 * 
 * .on()方法的特定和通用事件处理程序 */
export type GridStackEventHandler = (event: Event) => void;

/** 
 * event handler that also receives the element
 * 
 * 同时接收元素的事件处理程序 */
export type GridStackElementHandler = (event: Event, el: GridItemHTMLElement) => void;

/** 
 * event handler that receives nodes array
 * 
 * 接收节点数组的事件处理程序 */
export type GridStackNodesHandler = (event: Event, nodes: GridStackNode[]) => void;

/** 
 * event handler for dropped items
 * 
 * 处理已放置项目的事件处理程序 */
export type GridStackDroppedHandler = (event: Event, previousNode: GridStackNode, newNode: GridStackNode) => void;

/** 
 * union of all possible event handlers
 * 
 * 所有可能的事件处理程序的联合类型 */
export type GridStackEventHandlerCallback = GridStackEventHandler | GridStackElementHandler | GridStackNodesHandler | GridStackDroppedHandler;

/** 
 * optional function called during load() to callback the user on new added/remove grid items | grids
 * 
 * 在load()过程中调用的可选函数，用于回调用户新添加/移除的网格项或网格 */
export type AddRemoveFcn = (parent: HTMLElement, w: GridStackWidget, add: boolean, grid: boolean) => HTMLElement | undefined;

/** 
 * optional function called during save() to let the caller add additional custom data to the GridStackWidget structure that will get returned
 * 
 * 在save()过程中调用的可选函数，允许调用者向将要返回的GridStackWidget结构添加额外的自定义数据 */
export type SaveFcn = (node: GridStackNode, w: GridStackWidget) => void;

/** 
 * optional function called during load()/addWidget() to let the caller create custom content other than plan text
 * 
 * 在load()/addWidget()过程中调用的可选函数，允许调用者创建自定义内容而不是纯文本 */
export type RenderFcn = (el: HTMLElement, w: GridStackWidget) => void;

/** 
 * function for resizing elements to content
 * 
 * 根据内容调整元素大小的函数 */
export type ResizeToContentFcn = (el: GridItemHTMLElement) => void;

/** 
 * describes the responsive nature of the grid. NOTE: make sure to have correct extra CSS to support this.
 * 
 * 描述网格的响应式特性 */
export interface Responsive {
  /**
   *  wanted width to maintain (+-50%) to dynamically pick a column count. NOTE: make sure to have correct extra CSS to support this.
   * 
   * 希望维持的宽度以动态选择列数 */
  columnWidth?: number;

  /**
   *  maximum number of columns allowed (default: 12). NOTE: make sure to have correct extra CSS to support this.
   * 
   * 允许的最大列数 */
  columnMax?: number;

  /**
   *  explicit width:column breakpoints instead of automatic 'columnWidth'. NOTE: make sure to have correct extra CSS to support this.
   * 
   * 显式的宽度:列断点，代替自动的'columnWidth' */
  breakpoints?: Breakpoint[];

  /**
   *  specify if breakpoints are for window size or grid size (default:false = grid)
   * 
   * 指定断点是用于窗口大小还是网格大小 */
  breakpointForWindow?: boolean;

  /**
   *  global re-layout mode when changing columns
   * 
   * 改变列数时的全局重新布局模式 */
  layout?: ColumnOptions;
}

/**
 * Responsive breakpoint configuration
 * 
 * 响应式断点配置 
 * */
export interface Breakpoint {
  /** 
   * `<=` width for the breakpoint to trigger
   * 
   * `<=` 触发断点的宽度 
   * */
  w?: number;

  /** 
   * column count
   * 
   * 列数
   *  */
  c: number;

  /** 
   * re-layout mode if different from global one
   * 
   * 如果与全局设置不同的重新布局模式 
   * */
  layout?: ColumnOptions;
  /** TODO: children layout, which spells out exact locations and could omit/add some children */
  // children?: GridStackWidget[];
}

/**
 * Defines the options for a Grid
 * 
 * 定义网格的选项
 */
export interface GridStackOptions {
  /**
   * accept widgets dragged from other grids or from outside (default: `false`). Can be:
   * `true` `(uses `'.grid-stack-item'` class filter)` or `false`,
   * string for explicit class name,
   * function returning a boolean. See [example](http://gridstack.github.io/gridstack.js/demo/two.html)
   * 
   * 接受从其他网格或外部拖动的部件（默认值：`false`）。可以是：
   * - `true`（使用`'.grid-stack-item'`类过滤器）或`false`
   * - 字符串形式的明确类名
   * - 返回布尔值的函数。参见[示例](http://gridstack.github.io/gridstack.js/demo/two.html)
   */
  acceptWidgets?: boolean | string | ((element: Element) => boolean);

  /** possible values (default: `mobile`) - does not apply to non-resizable widgets
    * `false` the resizing handles are only shown while hovering over a widget
    * `true` the resizing handles are always shown
    * 'mobile' if running on a mobile device, default to `true` (since there is no hovering per say), else `false`.
       See [example](http://gridstack.github.io/gridstack.js/demo/mobile.html)
    * 
    * 控制何时显示调整大小的句柄 
    */
  alwaysShowResizeHandle?: true | false | 'mobile';

  /** 
   * turns animation on (default?: true)
   * 
   * 启用动画
   *  */
  animate?: boolean;

  /** 
   * if false gridstack will not initialize existing items (default?: true)
   * 
   * 如果为false，gridstack将不会初始化现有项目 
   * */
  auto?: boolean;

  /**
   * one cell height (default?: 'auto'). Can be:
   *  an integer (px)
   *  a string (ex: '100px', '10em', '10rem'). Note: % doesn't work right - see demo/cell-height.html
   *  0, in which case the library will not generate styles for rows. Everything must be defined in your own CSS files.
   *  'auto' - height will be calculated for square cells (width / column) and updated live as you resize the window - also see `cellHeightThrottle`
   *  'initial' - similar to 'auto' (start at square cells) but stay that size during window resizing.
   *
   * 单元格高度 
   * */
  cellHeight?: numberOrString;

  /** throttle time delay (in ms) used when cellHeight='auto' to improve performance vs usability (default?: 100).
   * A value of 0 will make it instant at a cost of re-creating the CSS file at ever window resize event!
   *
   * cellHeight='auto'时的节流时间延迟
   *  */
  cellHeightThrottle?: number;

  /** 
   * (internal) unit for cellHeight (default? 'px') which is set when a string cellHeight with a unit is passed (ex: '10rem')
   * 
   * cellHeight的单位 
   * */
  cellHeightUnit?: string;


  /** 
   * list of children item to create when calling load() or addGrid()
   * 
   * 调用load()或addGrid()时要创建的子项列表
   *  */
  children?: GridStackWidget[];

  /** 
   * number of columns (default?: 12). Note: IF you change this, CSS also have to change. See https://github.com/gridstack/gridstack.js#change-grid-columns.
   * Note: for nested grids, it is recommended to use 'auto' which will always match the container grid-item current width (in column) to keep inside and outside
   * items always the same. flag is NOT supported for regular non-nested grids.
   *
   * 列数 */
  column?: number | 'auto';

  /** 
   * responsive column layout for width:column behavior
   * 
   * 宽度:列行为的响应式列布局 */
  columnOpts?: Responsive;

  /** 
   * additional class on top of '.grid-stack' (which is required for our CSS) to differentiate this instance.
   * Note: only used by addGrid(), else your element should have the needed class
   * 
   * 在'.grid-stack'之上的额外类，以区分此实例 */
  class?: string;

  /** 
   * disallows dragging of widgets (default?: false)
   * 
   * 禁止拖动部件 */
  disableDrag?: boolean;

  /** 
   * disallows resizing of widgets (default?: false).
   * 
   * 禁止调整部件大小 */
  disableResize?: boolean;

  /**
   *  allows to override UI draggable options.
   *  `(default?: { handle?: '.grid-stack-item-content', appendTo?: 'body' })`
   * 
   * 允许覆盖UI可拖动选项 
   * */
  draggable?: DDDragOpt;

  /** 
   * let user drag nested grid items out of a parent or not (default true - not supported yet)
   * 
   * 允许用户将嵌套的网格项拖出父项
   *  */
  //dragOut?: boolean;

  /** 
   * the type of engine to create (so you can subclass) default to GridStackEngine 
   * 
   * 要创建的引擎类型
   *  */
  engineClass?: typeof GridStackEngine;

  /** 
   * enable floating widgets (default?: false) See example (http://gridstack.github.io/gridstack.js/demo/float.html)
   * 
   * 启用浮动部件 
   * */
  float?: boolean;

  /** 
   * draggable handle selector (default?: '.grid-stack-item-content')
   * 
   * 可拖动句柄选择器
   *  */
  handle?: string;

  /** 
   * draggable handle class (e.g. 'grid-stack-item-content'). If set 'handle' is ignored (default?: null)
   * 
   * 可拖动句柄类
   *  */
  handleClass?: string;

  /** 
   * additional widget class (default?: 'grid-stack-item')
   * 
   * 额外的部件类 */
  itemClass?: string;

  /** 
   * re-layout mode when we're a subgrid and we are being resized. default to 'list'
   * 
   * 当我们是子网格并且正在调整大小时的重新布局模式。默认为'list'
   */
  layout?: ColumnOptions;

  /**
   *  true when widgets are only created when they scroll into view (visible)
   * 
   * 当部件仅在滚动到视图中时创建时为true */
  lazyLoad?: boolean;

  /**
   * gap between grid item and content (default?: 10). This will set all 4 sides and support the CSS formats below
   *  an integer (px)
   *  a string with possible units (ex: '2em', '20px', '2rem')
   *  string with space separated values (ex: '5px 10px 0 20px' for all 4 sides, or '5em 10em' for top/bottom and left/right pairs like CSS).
   * Note: all sides must have same units (last one wins, default px)
   *
   * 网格项和内容之间的间隙 */
  margin?: numberOrString;

  /** 
   * OLD way to optionally set each side - use margin: '5px 10px 0 20px' instead. Used internally to store each side. 
   *
   *  旧方法可选地设置每一侧 - 使用margin: '5px 10px 0 20px'代替 */
  marginTop?: numberOrString;
  marginRight?: numberOrString;
  marginBottom?: numberOrString;
  marginLeft?: numberOrString;

  /** 
   * unit for margin (default? 'px') set when `margin` is set as string with unit (ex: 2rem')
   * 
   * margin的单位 */
  marginUnit?: string;

  /**
   *  maximum rows amount. Default? is 0 which means no maximum rows
   * 
   * 最大行数 */
  maxRow?: number;

  /**
   *  minimum rows amount. Default is `0`. You can also do this with `min-height` CSS attribute
   * on the grid div in pixels, which will round to the closest row.
   * 
   * 最小行数 */
  minRow?: number;

  /** 
   * If you are using a nonce-based Content Security Policy, pass your nonce here and
   * GridStack will add it to the `<style>` elements it creates.
   * 
   * 如果您使用基于nonce的内容安全策略，请在此处传递您的nonce，GridStack将其添加到它创建的`<style>`元素中。 */
  nonce?: string;

  /**
   *  class for placeholder (default?: 'grid-stack-placeholder')
   * 
   * 占位符的类 */
  placeholderClass?: string;

  /** 
   * placeholder default content (default?: '')
   * 
   * 占位符默认内容 */
  placeholderText?: string;

  /** 
   * allows to override UI resizable options. `(default?: { handles: 'se' })`
   * 
   * 允许覆盖UI可调整大小选项 */
  resizable?: DDResizeOpt;

  /**
   * if true widgets could be removed by dragging outside of the grid. It could also be a selector string (ex: ".trash"),
   * in this case widgets will be removed by dropping them there (default?: false)
   * See example (http://gridstack.github.io/gridstack.js/demo/two.html)
   *
   * 如果为true，可以通过拖动到网格外部来移除部件 */
  removable?: boolean | string;

  /** 
   * allows to override UI removable options. `(default?: { accept: '.grid-stack-item' })`
   * 
   * 允许覆盖UI可移除选项 */
  removableOptions?: DDRemoveOpt;

  /** 
   * fix grid number of rows. This is a shortcut of writing `minRow:N, maxRow:N`. (default `0` no constrain)
   *
   * 固定网格行数 */
  row?: number;

  /**
   * if true turns grid to RTL. Possible values are true, false, 'auto' (default?: 'auto')
   * See [example](http://gridstack.github.io/gridstack.js/demo/right-to-left(rtl).html)
   *
   * 如果为true，将网格转换为RTL */
  rtl?: boolean | 'auto';

  /** 
   * set to true if all grid items (by default, but item can also override) height should be based on content size instead of WidgetItem.h to avoid v-scrollbars.
   * Note: this is still row based, not pixels, so it will use ceil(getBoundingClientRect().height / getCellHeight())
   *
   * 如果所有网格项的高度应基于内容大小，则设置为true */
  sizeToContent?: boolean;

  /**
   * makes grid static (default?: false). If `true` widgets are not movable/resizable.
   * You don't even need draggable/resizable. A CSS class
   * 'grid-stack-static' is also added to the element.
   *
   * 使网格静态 */
  staticGrid?: boolean;

  /** 
   * @deprecated Not used anymore, styles are now implemented with local CSS variables
   * 
   * @deprecated 不再使用，样式现在使用本地CSS变量实现 */
  styleInHead?: boolean;

  /** 
   * list of differences in options for automatically created sub-grids under us (inside our grid-items)
   * 
   * 我们下方自动创建的子网格选项的差异列表 */
  subGridOpts?: GridStackOptions;

  /** 
   * enable/disable the creation of sub-grids on the fly by dragging items completely
   * over others (nest) vs partially (push). Forces `DDDragOpt.pause=true` to accomplish that.
   * 
   * 通过完全拖动项目来启用/禁用动态创建子网格（嵌套）与部分（推送）。强制`DDDragOpt.pause=true`来实现这一点。 */
  subGridDynamic?: boolean;
}

/** 
 * options used during GridStackEngine.moveNode()
 * 
 * GridStackEngine.moveNode()期间使用的选项 */
export interface GridStackMoveOpts extends GridStackPosition {
  /** 
   * node to skip collision
   * 
   * 跳过碰撞的节点 */
  skip?: GridStackNode;
  /** 
   * do we pack (default true)
   * 
   * 我们是否打包（默认true） */
  pack?: boolean;
  /** 
   * true if we are calling this recursively to prevent simple swap or coverage collision - default false
   * 
   * 如果我们递归调用此方法以防止简单交换或覆盖碰撞，则为true - 默认false */
  nested?: boolean;
  /** 
   * vars to calculate other cells coordinates
   * 
   * 计算其他单元格坐标的变量 */
  cellWidth?: number;
  cellHeight?: number;
  marginTop?: number;
  marginBottom?: number;
  marginLeft?: number;
  marginRight?: number;
  /** 
   * position in pixels of the currently dragged items (for overlap check)
   * 
   * 当前拖动项目的位置（以像素为单位）（用于重叠检查） */
  rect?: GridStackPosition;
  /** 
   * true if we're live resizing
   * 
   * 如果我们正在实时调整大小，则为true */
  resizing?: boolean;
  /** 
   * best node (most coverage) we collied with
   * 
   * 我们碰撞的最佳节点（覆盖最多） */
  collide?: GridStackNode;
  /** 
   * for collision check even if we don't move
   * 
   * 即使我们不移动也进行碰撞检查 */
  forceCollide?: boolean;
}

export interface GridStackPosition {
  /** 
   * widget position x (default?: 0)
   * 
   * 小部件位置x */
  x?: number;
  /** 
   * widget position y (default?: 0)
   * 
   * 小部件位置y */
  y?: number;
  /** 
   * widget dimension width (default?: 1)
   * 
   * 小部件尺寸宽度 */
  w?: number;
  /** 
   * widget dimension height (default?: 1)
   * 
   * 小部件尺寸高度 */
  h?: number;
}

/**
 * GridStack Widget creation options
 * GridStack小部件创建选项
 */
export interface GridStackWidget extends GridStackPosition {
  /** 
   * if true then x, y parameters will be ignored and widget will be places on the first available position
   * 
   * 如果为true，则忽略x，y参数，小部件将放置在第一个可用位置 */
  autoPosition?: boolean;
  /** 
   * minimum width allowed during resize/creation (default?: undefined = un-constrained)
   * 
   * 调整大小/创建期间允许的最小宽度 */
  minW?: number;
  /** 
   * maximum width allowed during resize/creation (default?: undefined = un-constrained)
   * 
   * 调整大小/创建期间允许的最大宽度 */
  maxW?: number;
  /** 
   * minimum height allowed during resize/creation (default?: undefined = un-constrained)
   * 
   * 调整大小/创建期间允许的最小高度 */
  minH?: number;
  /** 
   * maximum height allowed during resize/creation (default?: undefined = un-constrained)
   * 
   * 调整大小/创建期间允许的最大高度 */
  maxH?: number;
  /** 
   * prevent direct resizing by the user (default?: undefined = un-constrained)
   * 
   * 防止用户直接调整大小 */
  noResize?: boolean;
  /** 
   * prevents direct moving by the user (default?: undefined = un-constrained)
   * 
   * 防止用户直接移动 */
  noMove?: boolean;
  /** 
   * same as noMove+noResize but also prevents being pushed by other widgets or api (default?: undefined = un-constrained)
   * 
   * 与noMove+noResize相同，但也防止被其他小部件或api推送 */
  locked?: boolean;
  /** 
   * value for `gs-id` stored on the widget (default?: undefined)
   * 
   * 存储在小部件上的`gs-id`值 */
  id?: string;
  /** 
   * html to append inside as content
   * 
   * 作为内容附加的html */
  content?: string;
  /** 
   * true when widgets are only created when they scroll into view (visible)
   * 
   * 当小部件仅在滚动到视图中时创建时为true */
  lazyLoad?: boolean;
  /** 
   * local (vs grid) override - see GridStackOptions.
   * 
   * Note: This also allow you to set a maximum h value (but user changeable during normal resizing) to prevent unlimited content from taking too much space (get scrollbar)
   * 本地（与网格相比）覆盖 - 请参阅GridStackOptions。
   * 注意：这还允许您设置最大h值（但在正常调整大小期间用户可更改），以防止无限内容占用过多空间（获取滚动条） */
  sizeToContent?: boolean | number;
  /** 
   * local override of GridStack.resizeToContentParent that specify the class to use for the parent (actual) vs child (wanted) height
   * 
   * GridStack.resizeToContentParent的本地覆盖，指定用于父级（实际）与子级（所需）高度的类 */
  resizeToContentParent?: string;
  /** 
   * optional nested grid options and list of children, which then turns into actual instance at runtime to get options from
   * 
   * 可选的嵌套网格选项和子项列表，然后在运行时转换为实际实例以获取选项 */
  subGridOpts?: GridStackOptions;
}

/**
 *  Drag&Drop resize options
 * 
 * 拖放调整大小选项 */
export interface DDResizeOpt {
  /**
   *  do resize handle hide by default until mouse over ? - default: true on desktop, false on mobile
   * 
   * 默认情况下调整大小句柄是否隐藏，直到鼠标悬停？ - 桌面默认：true，移动设备默认：false */
  autoHide?: boolean;
  /**
   * 
   * 
   * sides where you can resize from (ex: 'e, se, s, sw, w') - default 'se' (south-east)
   * 可以调整大小的侧面（例如：'e, se, s, sw, w'） - 默认'se'（东南）
   * Note: it is not recommended to resize from the top sides as weird side effect may occur.
   * 注意：不建议从顶部调整大小，因为可能会出现奇怪的副作用。
  */
  handles?: string;
}

/**
 * Drag&Drop remove options
 * 
 * 拖放移除选项 */
export interface DDRemoveOpt {
  /**
   * class that can be removed (default?: opts.itemClass)
   * 
   * 可以移除的类 */
  accept?: string;
  /**
   * class that cannot be removed(default: 'grid-stack-non-removable')
   * 
   * 不能移除的类 */
  decline?: string;
}

/** 
 * Drag&Drop dragging options
 * 
 * 拖放拖动选项 */
export interface DDDragOpt {
  /**
   *  class selector of items that can be dragged. default to '.grid-stack-item-content'
   * 
   * 可以拖动的项目的类选择器 */
  handle?: string;
  /**
   *  default to 'body'
   * 
   * 默认值为'body' */
  appendTo?: string;
  /**
   *  if set (true | msec), dragging placement (collision) will only happen after a pause by the user. Note: this is Global
   * 
   * 如果设置（true | msec），拖动放置（碰撞）仅在用户暂停后发生。注意：这是全局的 */
  pause?: boolean | number;
  /**
   *  default to `true`
   * 
   * 默认值为`true` */
  scroll?: boolean;
  /**
   *  prevents dragging from starting on specified elements, listed as comma separated selectors (eg: '.no-drag'). default built in is 'input,textarea,button,select,option'
   * 
   * 防止在指定元素上开始拖动，列为逗号分隔的选择器（例如：'.no-drag'）。内置默认值为'input,textarea,button,select,option' */
  cancel?: string;
  /**
   *  helper function when dropping: 'clone' or your own method
   * 
   * 放置时的辅助函数：'clone'或您自己的方法 */
  helper?: 'clone' | ((el: HTMLElement) => HTMLElement);
  /**
   *  callbacks
   * 
   * 回调 */
  start?: (event: Event, ui: DDUIData) => void;
  stop?: (event: Event) => void;
  drag?: (event: Event, ui: DDUIData) => void;
}
export interface Size {
  width: number;
  height: number;
}
export interface Position {
  top: number;
  left: number;
}
export interface Rect extends Size, Position { }

/** 
 * data that is passed during drag and resizing callbacks
 * 
 * 在拖动和调整大小回调期间传递的数据 */
export interface DDUIData {
  position?: Position;
  size?: Size;
  draggable?: HTMLElement;
  /* fields not used by GridStack but sent by jq ? leave in case we go back to them...
  originalPosition? : Position;
  offset?: Position;
  originalSize?: Size;
  element?: HTMLElement[];
  helper?: HTMLElement[];
  originalElement?: HTMLElement[];
  */
}

/**
 * internal runtime descriptions describing the widgets in the grid
 * 描述网格中小部件的内部运行时描述
 */
export interface GridStackNode extends GridStackWidget {
  /**
   *  pointer back to HTML element
   * 
   * 指向HTML元素的指针 */
  el?: GridItemHTMLElement;
  /**
   *  pointer back to parent Grid instance
   * 
   * 指向父网格实例的指针 */
  grid?: GridStack;
  /**
   *  actual sub-grid instance
   * 
   * 实际的子网格实例 */
  subGrid?: GridStack;
  /**
   *  allow delay creation when visible
   * 
   * 允许在可见时延迟创建 */
  visibleObservable?: IntersectionObserver;
  /**
   *  @internal internal id used to match when cloning engines or saving column layouts
   * 
   * @internal 内部id，用于在克隆引擎或保存列布局时匹配 */
  _id?: number;
  /**
   *  @internal does the node attr ned to be updated due to changed x,y,w,h values
   * 
   * @internal 由于x,y,w,h值的变化，节点属性是否需要更新 */
  _dirty?: boolean;
  /**
   *  @internal
   * 
   * @internal */
  _updating?: boolean;
  /**
   *  @internal true when over trash/another grid so we don't bother removing drag CSS style that would animate back to old position
   * 
   * @internal 当在垃圾桶/另一个网格上时为true，因此我们不必费心删除将动画返回到旧位置的拖动CSS样式 */
  _isAboutToRemove?: boolean;
  /**
   *  @internal true if item came from outside of the grid -> actual item need to be moved over
   * 
   * @internal 如果项目来自网格外部 -> 实际项目需要移动 */
  _isExternal?: boolean;
  /**
   *  @internal Mouse event that's causing moving|resizing
   * 
   * @internal 导致移动|调整大小的鼠标事件 */
  _event?: MouseEvent;
  /**
   *  @internal moving vs resizing
   * 
   * @internal 移动与调整大小 */
  _moving?: boolean;
  /**
   *  @internal is resizing?
   * 
   * @internal 是否正在调整大小？ */
  _resizing?: boolean;
  /**
   *  @internal true if we jumped down past item below (one time jump so we don't have to totally pass it)
   * 
   * @internal 如果我们跳过了下面的项目（一次跳跃，因此我们不必完全通过它），则为true */
  _skipDown?: boolean;
  /**
   *  @internal original values before a drag/size
   * 
   * @internal 拖动/调整大小前的原始值 */
  _orig?: GridStackPosition;
  /**
   *  @internal position in pixels used during collision check
   * 
   * @internal 碰撞检查期间使用的像素位置 */
  _rect?: GridStackPosition;
  /**
   *  @internal top/left pixel location before a drag so we can detect direction of move from last position
   * 
   * @internal 拖动前的顶部/左侧像素位置，以便我们可以检测到从最后位置移动的方向 */
  _lastUiPosition?: Position;
  /**
   *  @internal set on the item being dragged/resized remember the last positions we've tried (but failed) so we don't try again during drag/resize
   * 
   * @internal 设置在被拖动/调整大小的项目上，记住我们尝试过的最后位置（但失败了），因此在拖动/调整大小期间不会再次尝试 */
  _lastTried?: GridStackPosition;
  /**
   *  @internal position willItFit() will use to position the item
   * 
   * @internal willItFit()将使用的位置来定位项目 */
  _willFitPos?: GridStackPosition;
  /**
   *  @internal last drag Y pixel position used to incrementally update V scroll bar
   * 
   * @internal 最后一次拖动Y像素位置，用于增量更新V滚动条 */
  _prevYPix?: number;
  /**
   *  @internal true if we've remove the item from ourself (dragging out) but might revert it back (release on nothing -> goes back)
   * 
   * @internal 如果我们已经从自己移除了项目（拖出），但可能会恢复（释放在空白处 -> 返回），则为true */
  _temporaryRemoved?: boolean;
  /**
   *  @internal true if we should remove DOM element on _notify() rather than clearing _id (old way)
   * 
   * @internal 如果我们应该在_notify()上移除DOM元素而不是清除_id（旧方法），则为true */
  _removeDOM?: boolean;
  /**
   *  @internal original position/size of item if dragged from sidebar
   * 
   * @internal 如果从侧边栏拖动，项目的原始位置/大小 */
  _sidebarOrig?: GridStackPosition;
  /**
   *  @internal had drag&drop been initialized
   * 
   * @internal 拖放是否已初始化 */
  _initDD?: boolean;
}
