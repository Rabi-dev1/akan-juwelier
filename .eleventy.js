module.exports = function(eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "assets/css":    "assets/css"    });
  eleventyConfig.addPassthroughCopy({ "assets/js":     "assets/js"     });
  eleventyConfig.addPassthroughCopy({ "assets/images": "assets/images" });
  eleventyConfig.addPassthroughCopy({ "admin":         "admin"         });
  return {
    dir: {
      input: ".",
      output: "_site"
    }
  };
};
