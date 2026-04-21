const fs = require('fs');
const path = require('path');

const PAGES_FILE = path.join(__dirname, '../..', 'examples/backend/app/pages.json');

/**
 * 生成唯一的 uuid_page
 * @returns {string} - 唯一的 page ID
 */
function generateUuidPage() {
  return 'page_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * 生成唯一的 cardKey
 * @returns {string} - 唯一的 card key
 */
function generateCardKey() {
  return 'card_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

let pagesData = {
  pages: [],
  version: '1.0.0',
  createdAt: new Date().toISOString()
};

function loadPages() {
  try {
    if (fs.existsSync(PAGES_FILE)) {
      const content = fs.readFileSync(PAGES_FILE, 'utf8');
      pagesData = JSON.parse(content);
      console.log(`[Page Manager] Loaded ${pagesData.pages.length} pages from file`);
    } else {
      savePages();
      console.log('[Page Manager] Created new pages file');
    }
  } catch (error) {
    console.error('[Page Manager] Error loading pages:', error);
    pagesData = { pages: [], version: '1.0.0', createdAt: new Date().toISOString() };
  }
}

function savePages() {
  try {
    fs.writeFileSync(PAGES_FILE, JSON.stringify(pagesData, null, 2), 'utf8');
    console.log('[Page Manager] Pages saved to file');
  } catch (error) {
    console.error('[Page Manager] Error saving pages:', error);
  }
}

function addPage(pageInfo) {
  const page = {
    uuid_page: pageInfo.uuid_page,
    uuid_tile: pageInfo.uuid_tile,
    url_tile: pageInfo.url_tile,
    title: pageInfo.title || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'active',
    cardKey: pageInfo.cardKey || '',
    nodes: pageInfo.nodes || null,
    data: pageInfo.data || {}
  };

  const existingIndex = pagesData.pages.findIndex(p => p.uuid_page === page.uuid_page);
  if (existingIndex >= 0) {
    pagesData.pages[existingIndex] = { ...pagesData.pages[existingIndex], ...page, updatedAt: new Date().toISOString() };
  } else {
    pagesData.pages.push(page);
  }

  savePages();
  console.log('[Page Manager] Page added/updated:', page.uuid_page);
  return page;
}

function getPageWithNodes(uuid_page) {
  const page = pagesData.pages.find(p => p.uuid_page === uuid_page);
  if (page && page.nodes) {
    return page;
  }
  return null;
}

function savePageNodes(uuid_page, nodes, data = {}) {
  const index = pagesData.pages.findIndex(p => p.uuid_page === uuid_page);
  if (index >= 0) {
    pagesData.pages[index].nodes = nodes;
    pagesData.pages[index].data = { ...pagesData.pages[index].data, ...data };
    pagesData.pages[index].updatedAt = new Date().toISOString();
    savePages();
    console.log('[Page Manager] Page nodes saved:', uuid_page);
    return pagesData.pages[index];
  }
  return null;
}

function getPage(uuid_page) {
  return pagesData.pages.find(p => p.uuid_page === uuid_page);
}

function getPagesByTile(uuid_tile) {
  return pagesData.pages.filter(p => 
    p && typeof p === 'object' && 
    p.uuid_page && typeof p.uuid_page === 'string' &&
    p.uuid_tile === uuid_tile
  ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function getPagesByUrlTile(url_tile) {
  return pagesData.pages.filter(p => 
    p && typeof p === 'object' && 
    p.uuid_page && typeof p.uuid_page === 'string' &&
    p.url_tile === url_tile
  ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function getAllPages() {
  return [...pagesData.pages];
}

function updatePage(uuid_page, updates) {
  const index = pagesData.pages.findIndex(p => p.uuid_page === uuid_page);
  if (index >= 0) {
    pagesData.pages[index] = { ...pagesData.pages[index], ...updates, updatedAt: new Date().toISOString() };
    savePages();
    console.log('[Page Manager] Page updated:', uuid_page);
    return pagesData.pages[index];
  }
  return null;
}

function deletePage(uuid_page) {
  const index = pagesData.pages.findIndex(p => p.uuid_page === uuid_page);
  if (index >= 0) {
    const deleted = pagesData.pages.splice(index, 1)[0];
    savePages();
    console.log('[Page Manager] Page deleted:', uuid_page);
    return deleted;
  }
  return null;
}

function getPageCount() {
  return pagesData.pages.length;
}

/**
 * 根据 tile 和 visitor 获取最后一个页面
 * @param {Object} options - 查询选项
 * @param {string} [options.uuid_tile] - tile 的 UUID
 * @param {string} [options.url_tile] - tile 的 URL
 * @param {string} [options.uuid_visitor] - 访问者标识
 * @returns {string|null} - 最后一个页面的 uuid_page，不存在则返回 null
 */
function getLastPageForVisitor(options) {
  const { uuid_tile, url_tile, uuid_visitor } = options;
  
  // 过滤条件
  let filteredPages = pagesData.pages.filter(p => {
    if (!p || typeof p !== 'object' || !p.uuid_page) {
      return false;
    }
    
    // 匹配 tile（优先匹配 uuid_tile，其次匹配 url_tile）
    if (uuid_tile) {
      if (p.uuid_tile !== uuid_tile) {
        return false;
      }
    } else if (url_tile) {
      if (p.url_tile !== url_tile) {
        return false;
      }
    }
    
    return true;
  });
  
  // 如果没有提供 visitor，返回最新的页面
  if (!uuid_visitor || !uuid_visitor.trim()) {
    if (filteredPages.length > 0) {
      filteredPages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return filteredPages[0].uuid_page;
    }
    return null;
  }
  
  // 如果提供了 visitor，优先查找该 visitor 的页面
  const visitorPages = filteredPages.filter(p => {
    if (!p.data || typeof p.data !== 'object') {
      return false;
    }
    return p.data.uuid_visitor === uuid_visitor;
  });
  
  if (visitorPages.length > 0) {
    visitorPages.sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
    return visitorPages[0].uuid_page;
  }
  
  // 如果没有找到该 visitor 的页面，返回最新的页面（用于首次访问）
  if (filteredPages.length > 0) {
    filteredPages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return filteredPages[0].uuid_page;
  }
  
  return null;
}

/**
 * 获取或创建 tile 的页面 UUID
 * 如果提供了 uuid_page，直接返回；否则尝试获取已有页面，没有则创建新页面
 * @param {Object} options - 查询选项
 * @param {string} [options.uuid_page] - 页面的 UUID（如果提供，直接使用）
 * @param {string} [options.uuid_tile] - tile 的 UUID
 * @param {string} [options.url_tile] - tile 的 URL
 * @param {string} [options.uuid_visitor] - 访问者标识
 * @param {string} [options.title] - 页面标题
 * @returns {string} - 页面的 uuid_page
 */
function getTilePageUUID(options) {
  const { uuid_page, uuid_tile, url_tile, uuid_visitor, title } = options;
  
  // 如果提供了 uuid_page，检查页面是否存在，不存在则创建
  if (uuid_page && uuid_page.trim()) {
    const existingPage = getPage(uuid_page);
    if (!existingPage) {
      // 如果页面不存在，创建新页面记录
      const pageData = {
        uuid_page: uuid_page,
        uuid_tile: uuid_tile || '',
        url_tile: url_tile || '',
        title: title || '',
        cardKey: generateCardKey(),
        data: {}
      };
      if (uuid_visitor) {
        pageData.data.uuid_visitor = uuid_visitor;
      }
      addPage(pageData);
      console.log(`[Page Manager] Created new page with provided uuid_page: ${uuid_page}`);
    }
    return uuid_page;
  }
  
  // 先尝试获取已有的页面
  const existingPageUUID = getLastPageForVisitor({ uuid_tile, url_tile, uuid_visitor });
  
  if (existingPageUUID) {
    return existingPageUUID;
  }
  
  // 如果没有已有页面，创建新页面
  const newUUID = generateUuidPage();
  
  // 准备页面数据
  const pageData = {
    uuid_page: newUUID,
    uuid_tile: uuid_tile || '',
    url_tile: url_tile || '',
    title: title || '',
    cardKey: generateCardKey(),
    data: {}
  };
  
  // 如果提供了 visitor，存储到 data 中
  if (uuid_visitor) {
    pageData.data.uuid_visitor = uuid_visitor;
  }
  
  // 添加页面
  addPage(pageData);
  
  console.log(`[Page Manager] Created new page for tile: ${newUUID}`);
  
  return newUUID;
}

/**
 * 获取或创建 tile 的页面实例
 * 如果提供了 uuid_page，直接使用；否则尝试获取已有页面，没有则创建新页面
 * @param {Object} options - 查询选项
 * @param {string} [options.uuid_page] - 页面的 UUID（如果提供，直接使用）
 * @param {string} [options.uuid_tile] - tile 的 UUID
 * @param {string} [options.url_tile] - tile 的 URL
 * @param {string} [options.uuid_visitor] - 访问者标识
 * @param {string} [options.title] - 页面标题
 * @returns {Object} - 页面实例
 */
function getTilePage(options) {
  const uuid_page = getTilePageUUID(options);
  return getPage(uuid_page);
}

loadPages();

module.exports = {
  generateUuidPage,
  generateCardKey,
  addPage,
  getPage,
  getPageWithNodes,
  savePageNodes,
  getPagesByTile,
  getPagesByUrlTile,
  getAllPages,
  updatePage,
  deletePage,
  getPageCount,
  getLastPageForVisitor,
  getTilePageUUID,
  getTilePage
};
