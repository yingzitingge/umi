/* eslint-disable no-undef, prefer-rest-params */
const ReactIntl = require('react-intl');
const React = require('react');

let localeContext;

function setLocale(lang, realReload = true) {
  if (lang !== undefined && !/^([a-z]{2})-([A-Z]{2})$/.test(lang)) {
    // for reset when lang === undefined
    throw new Error('setLocale lang format error');
  }
  if (getLocale() !== lang) {
    window.g_lang = lang;
    window.localStorage.setItem('umi_locale', lang || '');
    // 触发 context 的 reload
    // 如果要刷新 location ，没必要进行 context 的 reload 了
    if (localeContext && !realReload) {
      localeContext.reloadAppLocale();
    }
    if (realReload) {
      window.location.reload();
    }
    // chrome 不支持这个事件。所以人肉触发一下
    if (window.dispatchEvent) {
      const event = new Event('languagechange');
      window.dispatchEvent(event);
    }
  }
}

function getLocale() {
  // support SSR
  const lang =
    typeof window.localStorage !== 'undefined' ? window.localStorage.getItem('umi_locale') : '';
  // ssr 时可规定一个参数 global.window = { g_lang: '' }
  return lang || window.g_lang || navigator.language;
}

const LangContext = React.createContext({
  lang: getLocale(),
});

// init api methods
let intl;
const intlApi = {};

[
  'formatMessage',
  'formatHTMLMessage',
  'formatDate',
  'formatTime',
  'formatRelative',
  'formatNumber',
  'formatPlural',
  'LangContext',
  'now',
  'onError',
].forEach(methodName => {
  intlApi[methodName] = function() {
    if (intl && intl[methodName]) {
      // _setIntlObject has been called
      return intl[methodName].call(intl, ...arguments);
    } else if (console && console.warn) {
      console.warn(
        `[umi-plugin-locale] ${methodName} not initialized yet, you should use it after react app mounted.`,
      );
    }
    return null;
  };
});

// react-intl 没有直接暴露 formatMessage 这个方法
// 只能注入到 props 中，所以通过在最外层包一个组件然后组件内调用这个方法来把 intl 这个对象暴露到这里来
// TODO 查找有没有更好的办法
function _setIntlObject(theIntl) {
  // umi 系统 API，不对外暴露
  intl = theIntl;
}

/**
 * 用于触发 context 的重新渲染 方法。可以实现不刷新进行切换语言
 * @param {*} context
 */
function _setLocaleContext(context) {
  localeContext = context;
}

module.exports = {
  ...ReactIntl,
  ...intlApi,
  setLocale,
  getLocale,
  _setIntlObject,
  LangContext,
  _setLocaleContext,
};
