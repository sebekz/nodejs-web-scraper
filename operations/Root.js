const HttpOperation = require("./HttpOperation");
const CompositeInjectMixin = require("./mixins/CompositeInjectMixin");
const CompositeScrapeMixin = require("./mixins/CompositeScrapeMixin");
const PageHelper = require("./helpers/PageHelper");
// const SPA_PageHelper = require('./helpers/SPA_PageHelper');

/**
 *
 * @mixes CompositeInjectMixin
 * @mixes CompositeScrapeMixin
 */
class Root extends HttpOperation {
  //Fetches the initial page, and starts the scraping process.

  /**
     *     
     * @param {Object} [config]    
     * @param {Object} [config.pagination = null] Look at the pagination API for more details.      
     * @param {Function} [config.getPageData = null] 
     * @param {Function} [config.getPageObject = null] Receives a dictionary of children, and an address argument
     * @param {Function} [config.getPageResponse = null] Receives an axiosResponse object
     * @param {Function} [config.getPageHtml = null] Receives htmlString and pageAddress
     * @param {Function} [config.getException = null] Listens to every exception. Receives the Error object. 

     */
  constructor(config) {
    super(config);
    this.operations = []; //References to child operation objects.
    // this.virtualOperations = []
    // this.pageHelper = new PageHelper(this);
    this.pageHelper = null;
  }

  /**
   *
   * @param {Operation} Operation
   */
  addOperation(Operation) {
    // this._addOperation(Operation);
    this.operations.push(Operation);
  }

  initPageHelper() {
    if (!this.scraper.config.usePuppeteer) {
      this.pageHelper = new PageHelper(this);
    } else {
      this.pageHelper = new SPA_PageHelper(this);
    }
  }

  /**
   * @return {Promise<void>}
   */
  async scrape() {
    if (!this.pageHelper) this.initPageHelper();

    const shouldPaginate = this.config.pagination ? true : false;
    // debugger;
    console.log("Root scrape processOneIteration");
    const data = await this.pageHelper.processOneIteration(
      this.scraper.config.startUrl,
      shouldPaginate
    );

    // debugger;
    this.data = data;
    // console.log(data);
    if (this.config.getPageData) {
      await this.config.getPageData(data);
    }
  }

  /**
   * Will get the errors from all registered operations.
   * @return {string[]}
   */
  getErrors() {
    // debugger;
    let errors = [...this.errors];

    this.scraper.state.registeredOperations.forEach((operation) => {
      if (operation.constructor.name !== "Root")
        errors = [...errors, ...operation.getErrors()];
    });
    return errors;
  }

  validateOperationArguments() {
    // return;
  }
}

Object.assign(Root.prototype, CompositeInjectMixin);
Object.assign(Root.prototype, CompositeScrapeMixin);

module.exports = Root;
