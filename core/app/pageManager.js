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

loadPages();

module.exports = {
  generateUuidPage,
  generateCardKey,
  addPage,
  getPage,
  getPageWithNodes,
  savePageNodes,
  getPagesByTile,
  getAllPages,
  updatePage,
  deletePage,
  getPageCount
};
