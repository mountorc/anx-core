/**
 * CLI 工具模块
 * 用于处理命令行参数和执行命令
 */

/**
 * 解析命令行参数
 * @returns {Object} - 解析后的参数对象
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const parsedArgs = {};
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg.startsWith('--')) {
      const key = arg.substring(2);
      const value = args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true;
      parsedArgs[key] = value;
      if (value !== true) {
        i++;
      }
    } else if (arg.startsWith('-')) {
      const key = arg.substring(1);
      const value = args[i + 1] && !args[i + 1].startsWith('-') ? args[i + 1] : true;
      parsedArgs[key] = value;
      if (value !== true) {
        i++;
      }
    } else {
      if (!parsedArgs._) {
        parsedArgs._ = [];
      }
      parsedArgs._.push(arg);
    }
  }
  
  return parsedArgs;
}

/**
 * 执行命令
 * @param {string} command - 要执行的命令
 * @param {Object} options - 执行选项
 * @returns {Promise<string>} - 命令执行结果
 */
async function executeCommand(command, options = {}) {
  const { spawn } = require('child_process');
  
  return new Promise((resolve, reject) => {
    const [cmd, ...args] = command.split(' ');
    const child = spawn(cmd, args, {
      stdio: 'pipe',
      shell: true,
      ...options
    });
    
    let stdout = '';
    let stderr = '';
    
    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(new Error(`Command failed with code ${code}: ${stderr}`));
      }
    });
    
    child.on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * 显示帮助信息
 * @param {Object} options - 帮助选项
 */
function showHelp(options = {}) {
  const { name = 'CLI Tool', version = '1.0.0', description = '', commands = [] } = options;
  
  console.log(`${name} v${version}`);
  console.log(description);
  console.log('');
  console.log('Commands:');
  
  commands.forEach(command => {
    console.log(`  ${command.name.padEnd(20)} ${command.description}`);
  });
  
  console.log('');
  console.log('Options:');
  console.log('  --help, -h        Show help information');
  console.log('  --version, -v     Show version information');
}

/**
 * 显示版本信息
 * @param {string} version - 版本号
 */
function showVersion(version) {
  console.log(`v${version}`);
}

// 导出所有功能
module.exports = {
  parseArgs,
  executeCommand,
  showHelp,
  showVersion
};
