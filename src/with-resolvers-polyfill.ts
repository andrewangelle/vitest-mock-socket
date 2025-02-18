Promise.withResolvers ||
  // @ts-expect-error
  (Promise.withResolvers = function withResolvers() {
    var a,
      b,
      c = new this((resolve, reject) => {
        a = resolve;
        b = reject;
      });
    return { resolve: a, reject: b, promise: c };
  });
