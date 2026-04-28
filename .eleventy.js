module.exports = function(eleventyConfig) {
  eleventyConfig.addPassthroughCopy("assets");
  eleventyConfig.addPassthroughCopy("admin");
  return {
    htmlTemplateEngine: false,
    dir: {
      input: ".",
      output: "_site"
    }
  };
};
