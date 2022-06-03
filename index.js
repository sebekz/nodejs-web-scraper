const CollectContent = require("./operations/CollectContent"),
  OpenLinks = require("./operations/OpenLinks"),
  CollectLinks = require("./operations/CollectLinks"),
  DownloadContent = require("./operations/DownloadContent"),
  Root = require("./operations/Root"),
  // ScrollToBottom = require('./limitedSpa/ScrollToBottom'),
  // ClickButton = require('./limitedSpa/ClickButton'),
  Scraper = require("./Scraper.js");

module.exports = {
  Scraper,
  Root,
  DownloadContent,
  OpenLinks,
  CollectLinks,
  CollectContent,
  // ScrollToBottom,
  // ClickButton
};
