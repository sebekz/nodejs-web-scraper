const HttpOperation = require("./HttpOperation");
const CompositeInjectMixin = require("./mixins/CompositeInjectMixin");
const CompositeScrapeMixin = require("./mixins/CompositeScrapeMixin");
// const Operation = require('./Operation')//For jsdoc
var cheerio = require("cheerio");
// var cheerioAdv = require('cheerio-advanced-selectors');
// cheerio = cheerioAdv.wrap(cheerio);
const {
  getBaseUrlFromBaseTag,
  createElementList,
} = require("../utils/cheerio");
const { getAbsoluteUrl } = require("../utils/url");
const PageHelper = require("./helpers/PageHelper");
// const SPA_PageHelper = require('./helpers/SPA_PageHelper');
// const { CustomResponse } = require('../request/request');//For jsdoc
const { mapPromisesWithLimitation } = require("../utils/concurrency");

/**
 *
 * @mixes CompositeInjectMixin
 * @mixes CompositeScrapeMixin
 */
class CollectLinks extends HttpOperation {
  // This operation is responsible for collecting links in a given page. It does not fetch the links themselves!

  /**
   *
   * @param {string} querySelector cheerio-advanced-selectors selector
   * @param {Object} [config]
   * @param {string} [config.name = 'Default CollectLinks name']
   * @param {Object} [config.pagination = null] Look at the pagination API for more details.
   * @param {number[]} [config.slice = null]
   * @param {Function} [config.condition = null] Receives a Cheerio node.  Use this hook to decide if this node should be included in the scraping. Return true or false
   * @param {Function} [config.getElementList = null] Receives an elementList array
   * @param {Function} [config.getPageData = null]
   * @param {Function} [config.getPageObject = null] Receives a dictionary of children, and an address argument
   * @param {Function} [config.getPageResponse = null] Receives an axiosResponse object
   * @param {Function} [config.getPageHtml = null] Receives htmlString and pageAddress
   * @param {Function} [config.getException = null] Listens to every exception. Receives the Error object.
   * @param {(href: string) => string} [config.transformHref = undefined] Callback that receives the href before it is opened.
   *
   */

  constructor(querySelector, config) {
    super(config);
    // this.pageHelper = new PageHelper(this);
    this.pageHelper = null;
    // this.compositeHelper = new CompositeHelper(this);
    // this.virtualOperations = []
    this.querySelector = querySelector;
    this.operations = [];
    this.noResultsPageHtml = config.noResultsPageHtml;

    if (
      typeof config === "object" &&
      typeof config.transformHref === "function"
    ) {
      this.transformHref = config.transformHref;
    } else {
      this.transformHref = function (href) {
        return href;
      };
    }
  }

  initPageHelper() {
    if (!this.scraper.config.usePuppeteer) {
      this.pageHelper = new PageHelper(this);
    } else {
      this.pageHelper = new SPA_PageHelper(this);
    }
  }

  validateOperationArguments() {
    if (!this.querySelector || typeof this.querySelector !== "string")
      throw new Error(
        `CollectLinks operation must be provided with a querySelector.`
      );
  }

  /**
   *
   * @param {{url:string,html:string}} params
   * @return {Promise<{type:string,name:string,data:[]}>}
   */
  async scrape({ url, html }) {
    if (this.noResultsPageHtml && html.search(this.noResultsPageHtml) > 0) {
      console.log("No more pages found. End of the line!");
      return;
    }
    if (!this.pageHelper) this.initPageHelper();
    // debugger;
    const refs = await this.createLinkList(html, url);
    console.log("refs", url, refs);

    if (!refs.length) {
      console.long("No more links found");
      return;
    }

    const hasCollectLinksOperation =
      this.operations.filter(
        (child) => child.constructor.name === "CollectLinks"
      ).length > 0; //Checks if the current page operation has any other page operations in it. If so, will force concurrency limitation.
    let forceConcurrencyLimit = false;
    if (hasCollectLinksOperation) {
      forceConcurrencyLimit = 3;
    }
    // debugger;
    const shouldPaginate = this.config.pagination ? true : false;
    const iterations = [];

    await mapPromisesWithLimitation(
      refs,
      async (href) => {
        // debugger;
        const data = await this.pageHelper.processOneIteration(
          this.transformHref(href),
          true // force next page
        );

        // if (this.config.getPageData) await this.config.getPageData(data);

        iterations.push(data);
      },
      forceConcurrencyLimit
        ? forceConcurrencyLimit
        : this.scraper.config.concurrency
    );

    this.data.push(...iterations);
    return {
      type: this.constructor.name,
      name: this.config.name,
      data: iterations,
    };
  }

  async createLinkList(html, url) {
    // debugger;
    var $ = cheerio.load(html);
    // debugger;
    const elementList = await createElementList($, this.querySelector, {
      condition: this.config.condition,
      slice: this.config.slice,
    });
    if (this.config.getElementList) {
      await this.config.getElementList(elementList);
    }
    const baseUrlFromBaseTag = getBaseUrlFromBaseTag(
      $,
      this.scraper.config.baseSiteUrl
    );

    const refs = [];
    elementList.forEach((link) => {
      const absoluteUrl = getAbsoluteUrl(
        baseUrlFromBaseTag || url,
        link[0].attribs.href
      );
      refs.push(absoluteUrl);
    });

    return refs;
  }
}

// Object.assign(CollectLinks.prototype, CompositeInjectMixin);
// Object.assign(CollectLinks.prototype, CompositeScrapeMixin);

module.exports = CollectLinks;
