/**
 * ANX CLI 主入口
 * 实现 ANX 命令行接口
 */

import { parseArgs } from './cli.js';
import commandsData from './commands.json' assert { type: 'json' };

/**
 * ANX CLI 命令执行器
 */
class AnxCLI {
  constructor() {
    // 存储组件状态
    this.components = new Map();
  }

  /**
   * 注册组件
   * @param {string} cardKey - 组件的 cardKey
   * @param {Object} component - 组件对象
   */
  registerComponent(cardKey, component) {
    this.components.set(cardKey, component);
  }

  /**
   * 获取 CLI 命令集
   * @returns {Object} - 命令集数据
   */
  getCommands() {
    return commandsData;
  }

  /**
   * 解析并执行 ANX CLI 命令
   * @param {string} command - 命令字符串
   * @returns {Object} - 执行结果
   */
  executeCommand(command) {
    try {
      // 解析命令
      const parts = this._parseCommand(command);
      if (!parts) {
        return {
          error: true,
          message: 'Invalid command format'
        };
      }

      const { cardKey, action, parameters } = parts;

      // 检查组件是否存在
      const component = this.components.get(cardKey);
      if (!component) {
        return {
          error: true,
          message: `Component not found: ${cardKey}`
        };
      }

      // 执行命令
      return this._executeAction(component, action, parameters);
    } catch (error) {
      return {
        error: true,
        message: error.message
      };
    }
  }

  /**
   * 解析命令字符串
   * @param {string} command - 命令字符串
   * @returns {Object|null} - 解析结果
   */
  _parseCommand(command) {
    // 简单的命令解析
    const parts = command.trim().split(/\s+/);
    
    if (parts.length < 3 || parts[0] !== 'anx') {
      return null;
    }

    const cardKey = parts[1];
    const action = parts[2];
    const parameters = parts.slice(3);

    return {
      cardKey,
      action,
      parameters
    };
  }

  /**
   * 执行具体的动作
   * @param {Object} component - 组件对象
   * @param {string} action - 动作名称
   * @param {Array} parameters - 参数列表
   * @returns {Object} - 执行结果
   */
  _executeAction(component, action, parameters) {
    switch (action) {
      // 查询命令
      case 'get_config':
        return this._getConfig(component);
      case 'get_form':
        return this._getForm(component);
      case 'get_node':
        return this._getNode(component);
      case 'get_children':
        return this._getChildren(component);
      case 'get_options':
        return this._getOptions(component);
      case 'get_value':
        return this._getValue(component);
      case 'get_state':
        return this._getState(component);
      case 'get_validate':
        return this._getValidate(component);

      // 输入和赋值命令
      case 'input':
        return this._input(component, parameters[0]);
      case 'fill':
        return this._fill(component, parameters[0]);
      case 'set':
        return this._set(component, parameters[0]);
      case 'set_form':
        return this._setForm(component, parameters[0]);
      case 'clear':
        return this._clear(component);
      case 'reset':
        return this._reset(component);

      // 选择命令
      case 'select':
        return this._select(component, parameters[0]);
      case 'add_option':
        return this._addOption(component, parameters[0]);
      case 'remove_option':
        return this._removeOption(component, parameters[0]);
      case 'check':
        return this._check(component);
      case 'uncheck':
        return this._uncheck(component);

      // 交互事件命令
      case 'tap':
        return this._tap(component);
      case 'double_tap':
        return this._doubleTap(component);
      case 'long_press':
        return this._longPress(component);
      case 'submit':
        return this._submit(component);
      case 'cancel':
        return this._cancel(component);
      case 'confirm':
        return this._confirm(component);

      // 显示控制命令
      case 'expand':
        return this._expand(component);
      case 'collapse':
        return this._collapse(component);
      case 'show':
        return this._show(component);
      case 'hide':
        return this._hide(component);

      // 页面导航命令
      case 'goto':
        return this._goto(component);
      case 'back':
        return this._back(component);
      case 'reload':
        return this._reload(component);
      case 'scroll_to':
        return this._scrollTo(component);

      // 状态控制命令
      case 'enable':
        return this._enable(component);
      case 'disable':
        return this._disable(component);
      case 'validate':
        return this._validate(component);

      default:
        return {
          error: true,
          message: `Unsupported action: ${action}`
        };
    }
  }

  // 查询命令实现
  _getConfig(component) {
    return {
      error: false,
      result: component.config || {}
    };
  }

  _getForm(component) {
    if (component.kind !== 'form') {
      return {
        error: true,
        message: 'Not a form component'
      };
    }
    return {
      error: false,
      result: component.value || {}
    };
  }

  _getNode(component) {
    return {
      error: false,
      result: component
    };
  }

  _getChildren(component) {
    const children = component.kinds || [];
    return {
      error: false,
      result: children.map(child => child.cardKey)
    };
  }

  _getOptions(component) {
    return {
      error: false,
      result: component.options || []
    };
  }

  _getValue(component) {
    return {
      error: false,
      result: component.value
    };
  }

  _getState(component) {
    return {
      error: false,
      result: {
        disabled: component.disabled || false,
        hidden: component.hidden || false,
        checked: component.checked || false,
        expanded: component.expanded || false
      }
    };
  }

  _getValidate(component) {
    return {
      error: false,
      result: {
        success: true,
        message: ''
      }
    };
  }

  // 输入和赋值命令实现
  _input(component, content) {
    if (!content) {
      return {
        error: true,
        message: 'Content is required'
      };
    }
    component.value = (component.value || '') + content;
    return {
      error: false,
      result: component.value
    };
  }

  _fill(component, content) {
    if (!content) {
      return {
        error: true,
        message: 'Content is required'
      };
    }
    component.value = content;
    return {
      error: false,
      result: component.value
    };
  }

  _set(component, value) {
    if (value === undefined) {
      return {
        error: true,
        message: 'Value is required'
      };
    }
    // 尝试解析值
    try {
      component.value = JSON.parse(value);
    } catch {
      component.value = value;
    }
    return {
      error: false,
      result: component.value
    };
  }

  _setForm(component, json) {
    if (component.kind !== 'form') {
      return {
        error: true,
        message: 'Not a form component'
      };
    }
    if (!json) {
      return {
        error: true,
        message: 'JSON is required'
      };
    }
    try {
      component.value = JSON.parse(json);
      return {
        error: false,
        result: component.value
      };
    } catch (error) {
      return {
        error: true,
        message: 'Invalid JSON'
      };
    }
  }

  _clear(component) {
    component.value = '';
    return {
      error: false,
      result: component.value
    };
  }

  _reset(component) {
    component.value = component.defaultValue || '';
    return {
      error: false,
      result: component.value
    };
  }

  // 选择命令实现
  _select(component, value) {
    if (!value) {
      return {
        error: true,
        message: 'Value is required'
      };
    }
    component.value = value;
    return {
      error: false,
      result: component.value
    };
  }

  _addOption(component, value) {
    if (!value) {
      return {
        error: true,
        message: 'Value is required'
      };
    }
    if (!Array.isArray(component.value)) {
      component.value = [];
    }
    if (!component.value.includes(value)) {
      component.value.push(value);
    }
    return {
      error: false,
      result: component.value
    };
  }

  _removeOption(component, value) {
    if (!value) {
      return {
        error: true,
        message: 'Value is required'
      };
    }
    if (Array.isArray(component.value)) {
      component.value = component.value.filter(item => item !== value);
    }
    return {
      error: false,
      result: component.value
    };
  }

  _check(component) {
    component.checked = true;
    return {
      error: false,
      result: { checked: true }
    };
  }

  _uncheck(component) {
    component.checked = false;
    return {
      error: false,
      result: { checked: false }
    };
  }

  // 交互事件命令实现
  _tap(component) {
    // 触发点击事件
    if (component.onClick) {
      component.onClick();
    }
    return {
      error: false,
      result: { tapped: true }
    };
  }

  _doubleTap(component) {
    // 触发双击事件
    if (component.onDoubleClick) {
      component.onDoubleClick();
    }
    return {
      error: false,
      result: { doubleTapped: true }
    };
  }

  _longPress(component) {
    // 触发长按事件
    if (component.onLongPress) {
      component.onLongPress();
    }
    return {
      error: false,
      result: { longPressed: true }
    };
  }

  _submit(component) {
    if (component.kind !== 'form') {
      return {
        error: true,
        message: 'Not a form component'
      };
    }
    // 触发提交事件
    if (component.onSubmit) {
      component.onSubmit();
    }
    return {
      error: false,
      result: { submitted: true }
    };
  }

  _cancel(component) {
    // 触发取消事件
    if (component.onCancel) {
      component.onCancel();
    }
    return {
      error: false,
      result: { cancelled: true }
    };
  }

  _confirm(component) {
    // 触发确认事件
    if (component.onConfirm) {
      component.onConfirm();
    }
    return {
      error: false,
      result: { confirmed: true }
    };
  }

  // 显示控制命令实现
  _expand(component) {
    component.expanded = true;
    return {
      error: false,
      result: { expanded: true }
    };
  }

  _collapse(component) {
    component.expanded = false;
    return {
      error: false,
      result: { expanded: false }
    };
  }

  _show(component) {
    component.hidden = false;
    return {
      error: false,
      result: { hidden: false }
    };
  }

  _hide(component) {
    component.hidden = true;
    return {
      error: false,
      result: { hidden: true }
    };
  }

  // 页面导航命令实现
  _goto(component) {
    if (component.href) {
      // 模拟导航
      console.log(`Navigating to: ${component.href}`);
    }
    return {
      error: false,
      result: { navigated: true }
    };
  }

  _back(component) {
    // 模拟返回
    console.log('Navigating back');
    return {
      error: false,
      result: { navigatedBack: true }
    };
  }

  _reload(component) {
    // 模拟刷新
    console.log('Reloading content');
    return {
      error: false,
      result: { reloaded: true }
    };
  }

  _scrollTo(component) {
    // 模拟滚动
    console.log(`Scrolling to component: ${component.cardKey}`);
    return {
      error: false,
      result: { scrolled: true }
    };
  }

  // 状态控制命令实现
  _enable(component) {
    component.disabled = false;
    return {
      error: false,
      result: { disabled: false }
    };
  }

  _disable(component) {
    component.disabled = true;
    return {
      error: false,
      result: { disabled: true }
    };
  }

  _validate(component) {
    // 模拟验证
    return {
      error: false,
      result: {
        success: true,
        message: ''
      }
    };
  }
}

// 导出 ANX CLI 实例
export const anxCLI = new AnxCLI();

// 导出 CLI 类
export default AnxCLI;
